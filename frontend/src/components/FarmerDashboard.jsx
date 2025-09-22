import React, { useState, useEffect } from 'react';
import AddProductForm from './AddProductForm';
import EditProductForm from './EditProductForm';
import StockManagement from './StockManagement';
import SalesReport from './SalesReport';

function FarmerDashboard({ auth }) {
  const [activeTab, setActiveTab] = useState('add');
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalRevenue: 0,
    bestProduct: null
  });
  const [filter, setFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState(null);
  const [managingStock, setManagingStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (auth && auth.token) {
      fetchFarmerProducts();
    }
  }, [auth]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const fetchFarmerProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/farmer/products', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        const products = await response.json();
        setFarmerProducts(products);

        // Calculate stats
        const totalProducts = products.length;
        const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
        const outOfStock = products.filter(p => p.stock_quantity === 0).length;

        // Fetch sales stats (MySQL query through backend)
        const salesRes = await fetch('http://localhost:3001/api/farmer/sales', {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        });
        const salesData = await salesRes.json();

        const bestProduct = salesData.bestProduct || null;

        setStats({
          totalProducts,
          lowStock,
          outOfStock,
          totalRevenue: salesData.totalRevenue || 0,
          bestProduct
        });
      }
    } catch (error) {
      console.error('Error fetching farmer products:', error);
      showNotification('Error fetching products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProductAdded = () => {
    fetchFarmerProducts();
    setActiveTab('manage');
    showNotification('Product added successfully');
  };

  const handleProductUpdated = () => {
    setEditingProduct(null);
    fetchFarmerProducts();
    showNotification('Product updated successfully');
  };

  const handleStockUpdated = () => {
    setManagingStock(null);
    fetchFarmerProducts();
    showNotification('Stock updated successfully');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleManageStock = (product) => {
    setManagingStock(product);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/farmer/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        fetchFarmerProducts();
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
        fetchFarmerProducts();
        showNotification(`Product ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      } else {
        showNotification('Error updating product status', 'error');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      showNotification('Error updating product status', 'error');
    }
  };

  const styles = {
    container: { maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' },
    header: { textAlign: 'center', marginBottom: '2rem', color: '#2E7D32' },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    statCard: {
      background: 'white',
      padding: '1.5rem',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    },
    statCardHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
    },
    statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#2E7D32' },
    statLabel: { color: '#666', fontSize: '0.9rem', textTransform: 'uppercase' },
    filterButtons: { 
      display: 'flex', 
      gap: '1rem', 
      marginBottom: '1rem',
      flexWrap: 'wrap'
    },
    tabButton: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      color: '#666',
      position: 'relative',
      transition: 'all 0.3s'
    },
    activeTabButton: {
      color: '#2E7D32',
      fontWeight: 'bold'
    },
    notification: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      borderRadius: '4px',
      color: 'white',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease'
    },
    successNotification: {
      backgroundColor: '#4CAF50'
    },
    errorNotification: {
      backgroundColor: '#f44336'
    },
    actionButton: {
      padding: '0.5rem 1rem',
      margin: '0.25rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'all 0.2s'
    },
    editButton: {
      backgroundColor: '#2196F3',
      color: 'white'
    },
    stockButton: {
      backgroundColor: '#FF9800',
      color: 'white'
    },
    deleteButton: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    statusButton: {
      backgroundColor: '#9e9e9e',
      color: 'white'
    },
    productCard: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: '0.3s',
      position: 'relative'
    },
    inactiveOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1
    },
    inactiveText: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      fontWeight: 'bold'
    }
  };

  // Apply filter
  const filteredProducts = farmerProducts.filter(p => {
    if (filter === "low") return p.stock_quantity > 0 && p.stock_quantity <= 5;
    if (filter === "out") return p.stock_quantity === 0;
    if (filter === "active") return p.is_active;
    if (filter === "inactive") return !p.is_active;
    return true;
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Farmer Dashboard</h2>

      {/* Notification */}
      {notification.show && (
        <div style={{
          ...styles.notification,
          ...(notification.type === 'error' ? styles.errorNotification : styles.successNotification)
        }}>
          {notification.message}
        </div>
      )}

      {/* Stats Section */}
      <div style={styles.stats}>
        <div 
          style={styles.statCard} 
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          onClick={() => setActiveTab('manage')}
        >
          <div style={styles.statLabel}>Total Products</div>
          <div style={styles.statValue}>{stats.totalProducts}</div>
        </div>
        <div 
          style={styles.statCard}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          onClick={() => { setActiveTab('manage'); setFilter('low'); }}
        >
          <div style={styles.statLabel}>Low Stock</div>
          <div style={{ ...styles.statValue, color: '#f57c00' }}>{stats.lowStock}</div>
        </div>
        <div 
          style={styles.statCard}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          onClick={() => { setActiveTab('manage'); setFilter('out'); }}
        >
          <div style={styles.statLabel}>Out of Stock</div>
          <div style={{ ...styles.statValue, color: '#d32f2f' }}>{stats.outOfStock}</div>
        </div>
        <div 
          style={styles.statCard}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          onClick={() => setActiveTab('sales')}
        >
          <div style={styles.statLabel}>Total Revenue</div>
          <div style={styles.statValue}>₹{stats.totalRevenue.toLocaleString()}</div>
        </div>
        {stats.bestProduct && (
          <div 
            style={styles.statCard}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={styles.statLabel}>Best Seller</div>
            <div style={styles.statValue}>{stats.bestProduct.product_name}</div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Sold: {stats.bestProduct.total_sold || 0}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          style={activeTab === 'add' ? { ...styles.tabButton, ...styles.activeTabButton } : styles.tabButton}
          onClick={() => setActiveTab('add')}
        >
          Add New Product
        </button>
        <button 
          style={activeTab === 'manage' ? { ...styles.tabButton, ...styles.activeTabButton } : styles.tabButton}
          onClick={() => setActiveTab('manage')}
        >
          Manage Products
        </button>
        <button 
          style={activeTab === 'sales' ? { ...styles.tabButton, ...styles.activeTabButton } : styles.tabButton}
          onClick={() => setActiveTab('sales')}
        >
          Sales Report
        </button>
      </div>

      {/* Add Product Form */}
      {activeTab === 'add' && <AddProductForm onProductAdded={handleProductAdded} auth={auth} />}

      {/* Edit Product Form */}
      {activeTab === 'manage' && editingProduct && (
        <EditProductForm 
          product={editingProduct} 
          onProductUpdated={handleProductUpdated} 
          onCancel={() => setEditingProduct(null)}
          auth={auth}
        />
      )}

      {/* Stock Management */}
      {activeTab === 'manage' && managingStock && (
        <StockManagement 
          product={managingStock} 
          onStockUpdated={handleStockUpdated} 
          onCancel={() => setManagingStock(null)}
          auth={auth}
        />
      )}

      {/* Sales Report */}
      {activeTab === 'sales' && (
        <SalesReport auth={auth} />
      )}

      {/* Manage Products */}
      {activeTab === 'manage' && !editingProduct && !managingStock && (
        <div>
          <h3>Your Products</h3>

          {/* Filter Buttons */}
          <div style={styles.filterButtons}>
            <button 
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === "low" ? "active" : ""}`}
              onClick={() => setFilter("low")}
            >
              Low Stock
            </button>
            <button 
              className={`filter-btn ${filter === "out" ? "active" : ""}`}
              onClick={() => setFilter("out")}
            >
              Out of Stock
            </button>
            <button 
              className={`filter-btn ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Active
            </button>
            <button 
              className={`filter-btn ${filter === "inactive" ? "active" : ""}`}
              onClick={() => setFilter("inactive")}
            >
              Inactive
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p>No products found for this filter.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredProducts.map(product => (
                <div key={product.product_id} style={styles.productCard}>
                  {!product.is_active && (
                    <div style={styles.inactiveOverlay}>
                      <div style={styles.inactiveText}>INACTIVE</div>
                    </div>
                  )}
                  {product.image_url && (
                    <img 
                      src={`http://localhost:3001/uploads/${product.image_url}`} 
                      alt={product.product_name}
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h4>{product.product_name}</h4>
                    <p>{product.description}</p>
                    <div>
                      <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>₹{product.price}</span>
                      <span style={{
                        marginLeft: '1rem',
                        color: product.stock_quantity > 5 ? '#2E7D32' : 
                               product.stock_quantity > 0 ? '#f57c00' : '#d32f2f'
                      }}>
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap' }}>
                      <button 
                        style={{ ...styles.actionButton, ...styles.editButton }}
                        onClick={() => handleEditProduct(product)}
                      >
                        Edit
                      </button>
                      <button 
                        style={{ ...styles.actionButton, ...styles.stockButton }}
                        onClick={() => handleManageStock(product)}
                      >
                        Manage Stock
                      </button>
                      <button 
                        style={{ ...styles.actionButton, ...styles.statusButton }}
                        onClick={() => handleToggleProductStatus(product.product_id, product.is_active)}
                      >
                        {product.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                        onClick={() => handleDeleteProduct(product.product_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FarmerDashboard;