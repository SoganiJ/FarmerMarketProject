import React, { useState, useEffect } from 'react';
import AddProductForm from './AddProductForm';
import EditProductForm from './EditProductForm';
import StockManagement from './StockManagement';
import SalesReport from './SalesReport';
import OrderManagement from './OrderManagement';
import Analytics from './Analytics';

function FarmerDashboard({ auth }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    bestProduct: null
  });
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [managingStock, setManagingStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, product: null, action: '' });
  // NEW: State for view-based analytics data
  const [viewData, setViewData] = useState(null);

  useEffect(() => {
    if (auth && auth.token) {
      fetchFarmerData();
    }
  }, [auth]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // NEW: Sync stock status using a cursor procedure
  const syncAllStockStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/update-stock-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        showNotification(`✅ ${result.message} (Used cursor procedure)`);
        fetchFarmerData(); // Refresh data to show updated statuses
      } else {
        showNotification('Error syncing stock status', 'error');
      }
    } catch (error) {
      console.error('Error syncing stock:', error);
      showNotification('Error syncing stock status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch view-based analytics
  const fetchViewAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/analytics/enhanced', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setViewData(data);
        showNotification('📊 Enhanced analytics loaded from database views');
        setActiveTab('view-analytics'); // Switch to the new tab to show the data
      } else {
        showNotification('Error fetching enhanced analytics', 'error');
      }
    } catch (error) {
      console.error('Error fetching view analytics:', error);
      showNotification('Error fetching enhanced analytics', 'error');
    } finally {
        setLoading(false);
    }
  };


  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      
      console.log('Starting to fetch farmer data...');
      
      const productsResponse = await fetch('http://localhost:3001/api/farmer/products', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      const ordersResponse = await fetch('http://localhost:3001/api/farmer/orders', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      const salesResponse = await fetch('http://localhost:3001/api/farmer/sales', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      const analyticsResponse = await fetch('http://localhost:3001/api/farmer/analytics', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      // NEW: Fetch view-based performance data
      const performanceResponse = await fetch('http://localhost:3001/api/analytics/farmer-performance', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      if (productsResponse.ok) {
        const products = await productsResponse.json();
        setFarmerProducts(products);
        console.log('Products data:', products);

        const totalProducts = products.length;
        const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length;
        const outOfStock = products.filter(p => p.stock_quantity === 0).length;

        if (ordersResponse.ok) {
          const orders = await ordersResponse.json();
          setFarmerOrders(orders);
          console.log('Orders data:', orders);
          
          const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

          // Get data from sales API
          let totalRevenue = 0;
          let bestProduct = null;
          
          if (salesResponse.ok) {
            const salesData = await salesResponse.json();
            console.log('Sales data:', salesData);
            totalRevenue = salesData.totalRevenue || 0;
            bestProduct = salesData.bestProduct || null;
          }

          // Get data from analytics API
          let totalCustomers = 0;
          
          if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json();
            console.log('Analytics data:', analytics);
            
            totalCustomers = analytics.customerStats?.total_customers || 
                             analytics.summary?.totalCustomers || 
                             0;
            
            // If we don't have best product from sales, try analytics
            if (!bestProduct && analytics.summary?.topProduct) {
              bestProduct = analytics.summary.topProduct;
            }
            
            // If we don't have revenue from sales, try analytics
            if (!totalRevenue && analytics.summary?.totalRevenue) {
              totalRevenue = analytics.summary.totalRevenue;
            }
          }

          // NEW: Get data from view-based performance API and merge if better
          if (performanceResponse.ok) {
            const performanceData = await performanceResponse.json();
            console.log('View-based performance data:', performanceData);
            
            // Use view data if it's more comprehensive
            if (performanceData.total_revenue > totalRevenue) {
              totalRevenue = performanceData.total_revenue;
            }
            if (performanceData.total_customers > totalCustomers) {
              totalCustomers = performanceData.total_customers;
            }
          }


          // Calculate total customers from orders if not available from analytics
          if (totalCustomers === 0 && orders.length > 0) {
            const uniqueCustomers = new Set(orders.map(order => order.customer_email || order.customer_name));
            totalCustomers = uniqueCustomers.size;
          }

          console.log('Final stats:', {
            totalProducts,
            lowStock,
            outOfStock,
            totalRevenue,
            pendingOrders,
            totalCustomers,
            bestProduct
          });

          setStats({
            totalProducts,
            lowStock,
            outOfStock,
            totalRevenue,
            pendingOrders,
            totalCustomers,
            bestProduct
          });
        }
      } else {
        console.error('Products response not ok:', productsResponse.status);
      }
    } catch (error) {
      console.error('Error fetching farmer data:', error);
      showNotification('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleProductAdded = () => {
    fetchFarmerData();
    setActiveTab('products');
    showNotification('Product added successfully');
  };

  const handleProductUpdated = () => {
    setEditingProduct(null);
    fetchFarmerData();
    showNotification('Product updated successfully');
  };

  const handleStockUpdated = () => {
    setManagingStock(null);
    fetchFarmerData();
    showNotification('Stock updated successfully');
  };

  const handleOrderStatusUpdated = () => {
    fetchFarmerData();
    showNotification('Order status updated successfully');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleManageStock = (product) => {
    setManagingStock(product);
  };

  const showConfirmDialog = (product, action) => {
    setConfirmDialog({ show: true, product, action });
  };

  const hideConfirmDialog = () => {
    setConfirmDialog({ show: false, product: null, action: '' });
  };

  const handleDeleteProduct = async (productId) => {
    hideConfirmDialog();
    
    try {
      const response = await fetch(`http://localhost:3001/api/farmer/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      if (response.ok) {
        fetchFarmerData();
        showNotification('Product deleted successfully');
      } else {
        showNotification('Error deleting product', 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Error deleting product', 'error');
    }
  };

  const handleToggleProductStatus = async (productId, currentStatus) => {
    hideConfirmDialog();
    
    try {
      const response = await fetch(`http://localhost:3001/api/farmer/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        fetchFarmerData();
        showNotification(`Product ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      } else {
        showNotification('Error updating product status', 'error');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      showNotification('Error updating product status', 'error');
    }
  };

  const getStatusButtonProps = (product) => {
    if (product.is_active) {
      return {
        text: 'Deactivate',
        className: 'status-btn deactivate',
        warning: 'Deactivating this product will hide it from customers.'
      };
    } else {
      return {
        text: 'Activate',
        className: 'status-btn activate',
        warning: 'Activating this product will make it visible to customers.'
      };
    }
  };

  // Apply filters including search
  const filteredProducts = farmerProducts.filter(p => {
    const matchesFilter = 
      filter === "all" ? true :
      filter === "low" ? (p.stock_quantity > 0 && p.stock_quantity <= 10) :
      filter === "out" ? p.stock_quantity === 0 :
      filter === "active" ? p.is_active :
      filter === "inactive" ? !p.is_active :
      true;

    const matchesSearch = searchQuery === "" || 
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const recentOrders = farmerOrders.slice(0, 5);
  const lowStockProducts = farmerProducts.filter(p => p.stock_quantity >= 0 && p.stock_quantity <= 10).slice(0, 5);
  const recentProducts = farmerProducts
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  const styles = {
    dashboard: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem 1rem',
      background: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)',
      minHeight: '100vh'
    },
    container: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #e8eaed',
      position: 'relative'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2.5rem'
    },
    headerTitle: {
      color: '#2c3e33',
      fontSize: '2.2rem',
      fontWeight: '700',
      margin: '0 0 0.5rem 0',
      letterSpacing: '-0.5px'
    },
    headerSubtitle: {
      color: '#5a6c7d',
      fontSize: '1rem',
      margin: 0
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2.5rem'
    },
    statCard: (isClickable) => ({
      background: '#ffffff',
      padding: '1.8rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      textAlign: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: isClickable ? 'pointer' : 'default',
      border: '1px solid #e8eaed',
      position: 'relative',
      overflow: 'hidden'
    }),
    statLabel: {
      color: '#8b9aa7',
      fontSize: '0.8rem',
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: '0.75rem',
      letterSpacing: '0.5px'
    },
    statValue: (color = '#2e7d32') => ({
      fontSize: '2.5rem',
      fontWeight: '700',
      color: color,
      margin: '0.5rem 0',
      lineHeight: '1'
    }),
    statSubtext: {
      fontSize: '0.85rem',
      color: '#8b9aa7',
      marginTop: '0.5rem'
    },
    tabs: {
      display: 'flex',
      background: '#f8f9fa',
      borderRadius: '12px',
      padding: '0.5rem',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    },
    tabBtn: (isActive) => ({
      padding: '0.75rem 1.5rem',
      border: 'none',
      background: isActive ? '#ffffff' : 'transparent',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: isActive ? '600' : '500',
      color: isActive ? '#2e7d32' : '#5a6c7d',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      flex: '1',
      minWidth: '120px',
      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
    }),
    overviewGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
      marginBottom: '2rem'
    },
    overviewCard: {
      background: '#ffffff',
      border: '1px solid #e8eaed',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    overviewCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: '2px solid #f8f9fa'
    },
    overviewCardTitle: {
      color: '#2c3e33',
      fontSize: '1.2rem',
      fontWeight: '600',
      margin: 0
    },
    overviewCardAction: {
      color: '#2e7d32',
      fontSize: '0.85rem',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'color 0.2s ease'
    },
    orderItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      marginBottom: '0.75rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      borderLeft: '4px solid #4CAF50',
      transition: 'all 0.2s ease'
    },
    orderInfo: {
      flex: 1
    },
    orderId: {
      fontWeight: '600',
      color: '#2c3e33',
      marginBottom: '0.25rem'
    },
    orderCustomer: {
      fontSize: '0.85rem',
      color: '#5a6c7d',
      marginBottom: '0.25rem'
    },
    orderDate: {
      fontSize: '0.8rem',
      color: '#8b9aa7'
    },
    orderStatus: (status) => ({
      padding: '0.4rem 0.8rem',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      background: 
        status === 'pending' ? '#fff3e0' :
        status === 'processing' ? '#e3f2fd' :
        status === 'shipped' ? '#e8f5e9' :
        status === 'delivered' ? '#e8f5e9' : '#ffebee',
      color:
        status === 'pending' ? '#f57c00' :
        status === 'processing' ? '#1976d2' :
        status === 'shipped' ? '#388e3c' :
        status === 'delivered' ? '#388e3c' : '#d32f2f'
    }),
    stockAlert: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      marginBottom: '0.75rem',
      background: '#fff3e0',
      borderRadius: '8px',
      borderLeft: '4px solid #ff9800',
      transition: 'all 0.2s ease'
    },
    productInfo: {
      flex: 1
    },
    productName: {
      fontWeight: '600',
      color: '#2c3e33',
      marginBottom: '0.25rem'
    },
    productStock: (level) => ({
      fontSize: '0.75rem',
      fontWeight: '600',
      padding: '0.35rem 0.75rem',
      borderRadius: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      background: 
        level === 'high' ? '#e8f5e9' :
        level === 'low' ? '#fff3e0' : '#ffebee',
      color:
        level === 'high' ? '#2e7d32' :
        level === 'low' ? '#f57c00' : '#d32f2f'
    }),
    quickAction: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '2px dashed #e2e8f0',
      textAlign: 'center',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    quickActionIcon: {
      fontSize: '2rem',
      marginBottom: '0.5rem'
    },
    quickActionText: {
      fontWeight: '600',
      color: '#2c3e33',
      fontSize: '0.9rem'
    },
    quickActionSubtext: {
      color: '#5a6c7d',
      fontSize: '0.8rem'
    },
    recentProduct: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      marginBottom: '0.75rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      transition: 'all 0.2s ease'
    },
    recentProductImage: {
      width: '60px',
      height: '60px',
      objectFit: 'cover',
      borderRadius: '8px'
    },
    recentProductInfo: {
      flex: 1
    },
    recentProductName: {
      fontWeight: '600',
      color: '#2c3e33',
      marginBottom: '0.25rem'
    },
    recentProductPrice: {
      color: '#2e7d32',
      fontWeight: '600',
      fontSize: '1rem'
    },
    emptyState: {
      textAlign: 'center',
      padding: '4rem 2rem',
      color: '#8b9aa7',
      background: '#f8f9fa',
      borderRadius: '12px',
      border: '2px dashed #e2e8f0'
    },
    loadingState: {
      textAlign: 'center',
      padding: '4rem 2rem',
      color: '#8b9aa7'
    },
    filtersSection: {
      background: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '12px',
      marginBottom: '2rem'
    },
    filtersRow: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    filterButtons: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap',
      flex: '1'
    },
    filterBtn: (isActive) => ({
      padding: '0.6rem 1.2rem',
      border: isActive ? 'none' : '1px solid #e2e8f0',
      background: isActive ? '#2e7d32' : '#ffffff',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '500',
      color: isActive ? '#ffffff' : '#5a6c7d',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    }),
    searchInput: {
      padding: '0.6rem 1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '0.9rem',
      color: '#2d3748',
      background: '#ffffff',
      transition: 'all 0.2s ease',
      outline: 'none',
      minWidth: '250px',
      flex: '1'
    },
    productsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1.5rem',
      marginTop: '1.5rem'
    },
    productCard: (isInactive) => ({
      background: '#ffffff',
      border: '1px solid #e8eaed',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      opacity: isInactive ? '0.6' : '1',
      position: 'relative'
    }),
    productImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      transition: 'transform 0.3s ease'
    },
    productContent: {
      padding: '1.5rem'
    },
    productTitle: {
      margin: '0 0 0.75rem 0',
      color: '#2c3e33',
      fontSize: '1.15rem',
      fontWeight: '600',
      lineHeight: '1.3'
    },
    productDescription: {
      color: '#5a6c7d',
      fontSize: '0.85rem',
      marginBottom: '1rem',
      lineHeight: '1.5',
      display: '-webkit-box',
      WebkitLineClamp: '2',
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    },
    productDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      padding: '0.75rem',
      background: '#f8f9fa',
      borderRadius: '8px'
    },
    productPrice: {
      color: '#2e7d32',
      fontWeight: '700',
      fontSize: '1.3rem'
    },
    productActions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '0.5rem'
    },
    actionBtn: (variant) => ({
      padding: '0.65rem 1rem',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      background:
        variant === 'edit' ? '#4caf50' :
        variant === 'stock' ? '#66bb6a' :
        variant === 'activate' ? '#388e3c' :
        variant === 'deactivate' ? '#9ccc65' :
        variant === 'delete' ? '#8bc34a' : '#e0e0e0',
      color: '#ffffff'
    }),
    notification: (type) => ({
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      color: 'white',
      zIndex: 1000,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease',
      fontWeight: '500',
      fontSize: '0.9rem',
      background: type === 'success' ? '#388e3c' : '#d32f2f',
      animation: 'slideIn 0.3s ease'
    }),
    confirmOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.2s ease'
    },
    confirmDialog: {
      background: '#ffffff',
      padding: '2rem',
      borderRadius: '16px',
      maxWidth: '420px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.3s ease'
    },
    confirmTitle: {
      margin: '0 0 1rem 0',
      color: '#2c3e33',
      fontSize: '1.4rem',
      fontWeight: '600'
    },
    confirmText: {
      color: '#5a6c7d',
      marginBottom: '1.5rem',
      lineHeight: '1.6',
      fontSize: '0.95rem'
    },
    confirmActions: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'flex-end'
    },
    confirmBtn: (variant) => ({
      padding: '0.75rem 1.5rem',
      border: variant === 'secondary' ? '2px solid #e2e8f0' : 'none',
      background: 
        variant === 'secondary' ? '#ffffff' :
        variant === 'danger' ? '#d32f2f' : '#f57c00',
      borderRadius: '8px',
      color: variant === 'secondary' ? '#5a6c7d' : '#ffffff',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      fontSize: '0.9rem'
    }),
  };

  const OverviewTab = () => (
    <div>
      {/* NEW: Database Features Quick Actions */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div 
          style={styles.quickAction}
          onClick={() => setActiveTab('add')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e8f5e9';
            e.currentTarget.style.borderColor = '#2e7d32';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{...styles.quickActionIcon, color: '#2e7d32'}}>➕</div>
          <div style={styles.quickActionText}>Add New Product</div>
          <div style={styles.quickActionSubtext}>Create new listing</div>
        </div>
        
        {/* NEW: Cursor Procedure Button */}
        <div 
          style={styles.quickAction}
          onClick={syncAllStockStatus}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e3f2fd';
            e.currentTarget.style.borderColor = '#2196F3';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{...styles.quickActionIcon, color: '#2196F3'}}>🔄</div>
          <div style={styles.quickActionText}>Sync Stock Status</div>
          <div style={styles.quickActionSubtext}>Uses database cursor</div>
        </div>
        
        {/* NEW: View Analytics Button */}
        <div 
          style={styles.quickAction}
          onClick={fetchViewAnalytics}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff3e0';
            e.currentTarget.style.borderColor = '#ff9800';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{...styles.quickActionIcon, color: '#ff9800'}}>📊</div>
          <div style={styles.quickActionText}>Enhanced Analytics</div>
          <div style={styles.quickActionSubtext}>From database views</div>
        </div>
        
        <div 
          style={styles.quickAction}
          onClick={() => setActiveTab('orders')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e3f2fd';
            e.currentTarget.style.borderColor = '#1976d2';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{...styles.quickActionIcon, color: '#1976d2'}}>📦</div>
          <div style={styles.quickActionText}>Manage Orders</div>
          <div style={styles.quickActionSubtext}>{stats.pendingOrders} pending</div>
        </div>
      </div>

      {/* NEW: View Data Display */}
      {viewData && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem' }}>
            📊 Enhanced Analytics (from Database Views)
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                ₹{viewData.performance?.total_revenue?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Orders</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {viewData.performance?.total_orders || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Items Sold</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {viewData.performance?.total_items_sold || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Data Source</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', 
                              padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                {viewData.analyticsSource}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.overviewGrid}>
        <div style={styles.overviewCard}>
          <div style={styles.overviewCardHeader}>
            <h3 style={styles.overviewCardTitle}>Recent Orders</h3>
            <span 
              style={styles.overviewCardAction}
              onClick={() => setActiveTab('orders')}
              onMouseEnter={(e) => e.target.style.color = '#1b5e20'}
              onMouseLeave={(e) => e.target.style.color = '#2e7d32'}
            >
              View All →
            </span>
          </div>
          {recentOrders.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No recent orders</p>
            </div>
          ) : (
            recentOrders.map(order => (
              <div 
                key={order.order_id} 
                style={styles.orderItem}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e8f5e9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
              >
                <div style={styles.orderInfo}>
                  <div style={styles.orderId}>Order #{order.order_id}</div>
                  <div style={styles.orderCustomer}>{order.customer_name}</div>
                  <div style={styles.orderDate}>
                    {new Date(order.order_date).toLocaleDateString()}
                  </div>
                </div>
                <div style={styles.orderStatus(order.status)}>
                  {order.status}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.overviewCard}>
          <div style={styles.overviewCardHeader}>
            <h3 style={styles.overviewCardTitle}>Stock Alerts</h3>
            <span 
              style={styles.overviewCardAction}
              onClick={() => { setActiveTab('products'); setFilter('low'); }}
              onMouseEnter={(e) => e.target.style.color = '#1b5e20'}
              onMouseLeave={(e) => e.target.style.color = '#2e7d32'}
            >
              Manage Stock →
            </span>
          </div>
          {lowStockProducts.length === 0 ? (
            <div style={styles.emptyState}>
              <p>All products have sufficient stock</p>
            </div>
          ) : (
            lowStockProducts.map(product => (
              <div 
                key={product.product_id} 
                style={styles.stockAlert}
                onMouseEnter={(e) => e.currentTarget.style.background = '#ffecb3'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff3e0'}
              >
                <div style={styles.productInfo}>
                  <div style={styles.productName}>{product.product_name}</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: product.stock_status === 'out_of_stock' ? '#d32f2f' : '#f57c00'
                  }}>
                    Status: {product.stock_status || (product.stock_quantity > 0 ? 'in_stock' : 'out_of_stock')} • Stock: {product.stock_quantity}
                  </div>
                </div>
                <button 
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}
                  onClick={() => handleManageStock(product)}
                >
                  Restock
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Add NEW tab for View-based Analytics
  const ViewAnalyticsTab = () => (
    <div>
      <div style={{
        background: '#ffffff',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#2c3e33', marginBottom: '1rem' }}>Database Views Analytics</h2>
        <p style={{ color: '#5a6c7d', marginBottom: '2rem' }}>
          This data is fetched directly from pre-aggregated database views for optimized performance and consistency.
        </p>
        
        <button
          onClick={fetchViewAnalytics}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '2rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          🔄 Refresh View Data
        </button>

        {viewData ? (
          <div>
            <div style={styles.statsGrid}>
              <div style={styles.statCard(false)}>
                <div style={styles.statLabel}>Total Revenue (View)</div>
                <div style={styles.statValue()}>
                  ₹{viewData.performance?.total_revenue?.toLocaleString() || 0}
                </div>
                <div style={styles.statSubtext}>From database view</div>
              </div>
              
              <div style={styles.statCard(false)}>
                <div style={styles.statLabel}>Total Orders (View)</div>
                <div style={styles.statValue()}>
                  {viewData.performance?.total_orders || 0}
                </div>
                <div style={styles.statSubtext}>From database view</div>
              </div>
              
              <div style={styles.statCard(false)}>
                <div style={styles.statLabel}>Items Sold (View)</div>
                <div style={styles.statValue()}>
                  {viewData.performance?.total_items_sold || 0}
                </div>
                <div style={styles.statSubtext}>From database view</div>
              </div>
            </div>

            {/* Top Products from View */}
            {viewData.topProducts && viewData.topProducts.length > 0 && (
              <div>
                <h3 style={{ color: '#2c3e33', marginBottom: '1rem', marginTop: '2rem' }}>Top Products (View Data)</h3>
                <div style={styles.productsGrid}>
                  {viewData.topProducts.map(product => (
                    <div key={product.product_id} style={styles.productCard(false)}>
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.product_name} 
                          style={styles.productImage}
                        />
                      )}
                      <div style={styles.productContent}>
                        <h4 style={styles.productTitle}>{product.product_name}</h4>
                        <p style={styles.productDescription}>
                          Total Revenue: ₹{product.total_revenue?.toLocaleString()}
                        </p>
                        <div style={styles.productDetails}>
                          <span style={styles.productPrice}>Sold: {product.total_sold}</span>
                          <span style={styles.productStock('high')}>
                            View Data
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p>Click "Refresh View Data" to load analytics from database views</p>
          </div>
        )}
      </div>
    </div>
  );


  return (
    <div style={styles.dashboard}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(100px); }
            to { opacity: 1; transform: translateX(0); }
          }
           @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          input:focus {
            border-color: #2e7d32 !important;
          }
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }
          .product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }
          .product-card:hover .product-image {
            transform: scale(1.05);
          }
          .tab-btn:hover {
            background: rgba(46, 125, 50, 0.1);
          }
          .filter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          .confirm-btn:hover {
            transform: translateY(-2px);
          }
        `}
      </style>

      {confirmDialog.show && (
        <div style={styles.confirmOverlay} onClick={hideConfirmDialog}>
          <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Confirm Action</h3>
            <p style={styles.confirmText}>
              {confirmDialog.action === 'delete' 
                ? 'Are you sure you want to delete this product? This action cannot be undone.'
                : getStatusButtonProps(confirmDialog.product).warning
              }
            </p>
            <div style={styles.confirmActions}>
              <button 
                style={styles.confirmBtn('secondary')} 
                onClick={hideConfirmDialog}
                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.background = '#ffffff'}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmBtn(confirmDialog.action === 'delete' ? 'danger' : 'warning')}
                onClick={() => {
                  if (confirmDialog.action === 'delete') {
                    handleDeleteProduct(confirmDialog.product.product_id);
                  } else {
                    handleToggleProductStatus(
                      confirmDialog.product.product_id, 
                      confirmDialog.product.is_active
                    );
                  }
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                {confirmDialog.action === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div style={styles.notification(notification.type)}>
          {notification.message}
        </div>
      )}

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Farmer Dashboard</h1>
          <p style={styles.headerSubtitle}>Manage your products and track your sales</p>
        </div>

        <div style={styles.statsGrid}>
          <div 
            style={styles.statCard(true)} 
            onClick={() => setActiveTab('products')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={styles.statLabel}>Total Products</div>
            <div style={styles.statValue()}>{stats.totalProducts}</div>
          </div>
          
          <div 
            style={styles.statCard(true)} 
            onClick={() => { setActiveTab('products'); setFilter('low'); }}
             onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={styles.statLabel}>Low Stock</div>
            <div style={styles.statValue('#f57c00')}>{stats.lowStock}</div>
          </div>
          
          <div 
            style={styles.statCard(true)} 
            onClick={() => { setActiveTab('products'); setFilter('out'); }}
             onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={styles.statLabel}>Out of Stock</div>
            <div style={styles.statValue('#d32f2f')}>{stats.outOfStock}</div>
          </div>
          
          <div 
            style={styles.statCard(true)} 
            onClick={() => setActiveTab('orders')}
             onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={styles.statLabel}>Pending Orders</div>
            <div style={styles.statValue('#f57c00')}>{stats.pendingOrders}</div>
          </div>
        </div>

        <div style={styles.tabs}>
            <button style={styles.tabBtn(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>Overview</button>
            <button style={styles.tabBtn(activeTab === 'add')} onClick={() => setActiveTab('add')}>Add Product</button>
            <button style={styles.tabBtn(activeTab === 'products')} onClick={() => setActiveTab('products')}>Products</button>
            <button style={styles.tabBtn(activeTab === 'orders')} onClick={() => setActiveTab('orders')}>Orders {stats.pendingOrders > 0 && `(${stats.pendingOrders})`}</button>
            <button style={styles.tabBtn(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>Analytics</button>
            <button style={styles.tabBtn(activeTab === 'view-analytics')} onClick={() => setActiveTab('view-analytics')}>View Analytics</button>
            <button style={styles.tabBtn(activeTab === 'sales')} onClick={() => setActiveTab('sales')}>Sales Report</button>
        </div>

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'add' && <AddProductForm onProductAdded={handleProductAdded} auth={auth} />}
        {activeTab === 'view-analytics' && <ViewAnalyticsTab />}

        {activeTab === 'products' && editingProduct && (
          <EditProductForm 
            product={editingProduct} 
            onProductUpdated={handleProductUpdated} 
            onCancel={() => setEditingProduct(null)}
            auth={auth}
          />
        )}

        {activeTab === 'products' && managingStock && (
          <StockManagement 
            product={managingStock} 
            onStockUpdated={handleStockUpdated} 
            onCancel={() => setManagingStock(null)}
            auth={auth}
          />
        )}

        {activeTab === 'products' && !editingProduct && !managingStock && (
           <div>
            <div style={styles.filtersSection}>
              <div style={styles.filtersRow}>
                <div style={styles.filterButtons}>
                  <button style={styles.filterBtn(filter === "all")} onClick={() => setFilter("all")} className="filter-btn">All</button>
                  <button style={styles.filterBtn(filter === "active")} onClick={() => setFilter("active")} className="filter-btn">Active</button>
                  <button style={styles.filterBtn(filter === "inactive")} onClick={() => setFilter("inactive")} className="filter-btn">Inactive</button>
                  <button style={styles.filterBtn(filter === "low")} onClick={() => setFilter("low")} className="filter-btn">Low Stock</button>
                  <button style={styles.filterBtn(filter === "out")} onClick={() => setFilter("out")} className="filter-btn">Out of Stock</button>
                </div>
                <input
                  type="text"
                  style={styles.searchInput}
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={styles.loadingState}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '4px solid #f0f0f0',
                  borderTop: '4px solid #2e7d32',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p>Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={styles.emptyState}>
                <h3 style={{ color: '#2c3e33', marginBottom: '0.5rem' }}>No Products Found</h3>
                <p>Try adjusting your filters or add a new product</p>
              </div>
            ) : (
              <div style={styles.productsGrid}>
                {filteredProducts.map((product) => {
                  const statusProps = getStatusButtonProps(product);
                  const stockLevel = 
                    product.stock_quantity > 10 ? 'high' :
                    product.stock_quantity > 0 ? 'low' : 'out';
                  
                  return (
                    <div 
                      key={product.product_id} 
                      style={styles.productCard(!product.is_active)}
                      className="product-card"
                    >
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.product_name} 
                          style={styles.productImage}
                          className="product-image"
                        />
                      )}
                      {!product.is_active && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          Inactive
                        </div>
                      )}
                      <div style={styles.productContent}>
                        <h4 style={styles.productTitle}>{product.product_name}</h4>
                        <p style={styles.productDescription}>
                          {product.description || 'No description available'}
                        </p>
                        <div style={styles.productDetails}>
                          <span style={styles.productPrice}>₹{product.price}</span>
                          <span style={styles.productStock(stockLevel)}>
                            Stock: {product.stock_quantity}
                          </span>
                        </div>
                        <div style={styles.productActions}>
                          <button style={styles.actionBtn('edit')} className="action-btn" onClick={() => handleEditProduct(product)}>Edit</button>
                          <button style={styles.actionBtn('stock')} className="action-btn" onClick={() => handleManageStock(product)}>Stock</button>
                          <button style={styles.actionBtn(product.is_active ? 'deactivate' : 'activate')} className="action-btn" onClick={() => showConfirmDialog(product, 'status')}>{statusProps.text}</button>
                          <button style={styles.actionBtn('delete')} className="action-btn" onClick={() => showConfirmDialog(product, 'delete')}>Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && <OrderManagement orders={farmerOrders} onOrderUpdated={handleOrderStatusUpdated} auth={auth}/>}
        {activeTab === 'analytics' && <Analytics auth={auth} />}
        {activeTab === 'sales' && <SalesReport auth={auth} />}
      </div>
    </div>
  );
}

export default FarmerDashboard;
