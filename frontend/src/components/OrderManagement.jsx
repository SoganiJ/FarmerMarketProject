import React, { useState } from 'react';

function OrderManagement({ orders, onOrderUpdated, auth }) {
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      const response = await fetch(`http://localhost:3001/api/farmer/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        onOrderUpdated();
      } else {
        alert('Error updating order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#fff3e0', color: '#f57c00', border: '#ffb74d' };
      case 'processing': return { bg: '#e3f2fd', color: '#1976d2', border: '#64b5f6' };
      case 'shipped': return { bg: '#e8f5e9', color: '#388e3c', border: '#81c784' };
      case 'delivered': return { bg: '#e8f5e9', color: '#2e7d32', border: '#66bb6a' };
      case 'cancelled': return { bg: '#ffebee', color: '#d32f2f', border: '#ef5350' };
      default: return { bg: '#f5f5f5', color: '#757575', border: '#bdbdbd' };
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending': return 'processing';
      case 'processing': return 'shipped';
      case 'shipped': return 'delivered';
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const styles = {
    container: {
      padding: '1.5rem',
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e8eaed'
    },
    header: {
      marginBottom: '2rem'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: '#2c3e33',
      margin: '0 0 1rem 0',
      letterSpacing: '-0.5px'
    },
    filters: {
      display: 'flex',
      gap: '0.75rem',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      padding: '1rem',
      background: '#f8f9fa',
      borderRadius: '10px'
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
    ordersList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    orderCard: {
      background: '#ffffff',
      border: '1px solid #e8eaed',
      borderRadius: '12px',
      padding: '1.5rem',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1.5rem',
      gap: '1rem',
      flexWrap: 'wrap'
    },
    orderInfo: {
      flex: '1',
      minWidth: '250px'
    },
    orderId: {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: '#2c3e33',
      margin: '0 0 0.5rem 0'
    },
    customerInfo: {
      fontSize: '0.9rem',
      color: '#5a6c7d',
      margin: '0.25rem 0',
      lineHeight: '1.5'
    },
    orderDate: {
      fontSize: '0.85rem',
      color: '#8b9aa7',
      margin: '0.25rem 0'
    },
    shippingAddress: {
      fontSize: '0.85rem',
      color: '#5a6c7d',
      margin: '0.5rem 0',
      padding: '0.75rem',
      background: '#f8f9fa',
      borderRadius: '6px',
      lineHeight: '1.4'
    },
    orderActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      alignItems: 'flex-end'
    },
    statusBadge: (status) => {
      const colors = getStatusColor(status);
      return {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: colors.bg,
        color: colors.color,
        border: `2px solid ${colors.border}`,
        whiteSpace: 'nowrap'
      };
    },
    statusUpdateBtn: {
      padding: '0.6rem 1.2rem',
      background: '#2e7d32',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    },
    cancelBtn: {
      padding: '0.6rem 1.2rem',
      background: '#ffffff',
      color: '#d32f2f',
      border: '2px solid #d32f2f',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    },
    orderItems: {
      marginTop: '1.5rem',
      padding: '1rem',
      background: '#f8f9fa',
      borderRadius: '10px'
    },
    itemsHeader: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#2c3e33',
      margin: '0 0 1rem 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    expandBtn: {
      background: 'none',
      border: 'none',
      color: '#2e7d32',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '600',
      padding: '0.25rem 0.5rem',
      transition: 'all 0.2s ease'
    },
    orderItem: {
      display: 'flex',
      gap: '1rem',
      padding: '1rem',
      background: '#ffffff',
      borderRadius: '8px',
      marginBottom: '0.75rem',
      alignItems: 'center',
      transition: 'all 0.2s ease',
      border: '1px solid #e8eaed'
    },
    itemImage: {
      width: '70px',
      height: '70px',
      objectFit: 'cover',
      borderRadius: '6px',
      border: '1px solid #e8eaed'
    },
    itemDetails: {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    },
    itemName: {
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#2c3e33'
    },
    itemQuantity: {
      fontSize: '0.85rem',
      color: '#5a6c7d'
    },
    itemPrice: {
      fontSize: '0.85rem',
      color: '#8b9aa7'
    },
    itemTotal: {
      fontSize: '1rem',
      fontWeight: '700',
      color: '#2e7d32',
      textAlign: 'right'
    },
    orderTotal: {
      marginTop: '1.5rem',
      padding: '1rem 1.5rem',
      background: '#e8f5e9',
      borderRadius: '8px',
      textAlign: 'right',
      fontSize: '1.2rem',
      fontWeight: '700',
      color: '#2e7d32',
      border: '2px solid #c8e6c9'
    },
    emptyState: {
      textAlign: 'center',
      padding: '4rem 2rem',
      color: '#8b9aa7',
      background: '#f8f9fa',
      borderRadius: '12px',
      border: '2px dashed #e2e8f0'
    },
    emptyTitle: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: '#2c3e33',
      marginBottom: '0.5rem'
    },
    statsRow: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap'
    },
    statCard: {
      flex: '1',
      minWidth: '150px',
      padding: '1rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1px solid #e8eaed'
    },
    statValue: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: '#2e7d32',
      margin: '0.25rem 0'
    },
    statLabel: {
      fontSize: '0.8rem',
      color: '#8b9aa7',
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: '0.5px'
    }
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .order-card {
            animation: slideIn 0.3s ease;
          }
          .order-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          }
          .order-item:hover {
            background: #f8f9fa;
          }
          .status-update-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
          }
          .cancel-btn:hover {
            background: #ffebee;
            transform: translateY(-2px);
          }
          .filter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .expand-btn:hover {
            text-decoration: underline;
          }
        `}
      </style>

      <div style={styles.header}>
        <h3 style={styles.title}>Order Management</h3>
        
        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{orderStats.total}</div>
            <div style={styles.statLabel}>Total Orders</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#f57c00' }}>{orderStats.pending}</div>
            <div style={styles.statLabel}>Pending</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#1976d2' }}>{orderStats.processing}</div>
            <div style={styles.statLabel}>Processing</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#388e3c' }}>{orderStats.shipped}</div>
            <div style={styles.statLabel}>Shipped</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <button 
          style={styles.filterBtn(filterStatus === 'all')}
          onClick={() => setFilterStatus('all')}
          className="filter-btn"
        >
          All Orders ({orderStats.total})
        </button>
        <button 
          style={styles.filterBtn(filterStatus === 'pending')}
          onClick={() => setFilterStatus('pending')}
          className="filter-btn"
        >
          Pending ({orderStats.pending})
        </button>
        <button 
          style={styles.filterBtn(filterStatus === 'processing')}
          onClick={() => setFilterStatus('processing')}
          className="filter-btn"
        >
          Processing ({orderStats.processing})
        </button>
        <button 
          style={styles.filterBtn(filterStatus === 'shipped')}
          onClick={() => setFilterStatus('shipped')}
          className="filter-btn"
        >
          Shipped ({orderStats.shipped})
        </button>
        <button 
          style={styles.filterBtn(filterStatus === 'delivered')}
          onClick={() => setFilterStatus('delivered')}
          className="filter-btn"
        >
          Delivered ({orderStats.delivered})
        </button>
        <button 
          style={styles.filterBtn(filterStatus === 'cancelled')}
          onClick={() => setFilterStatus('cancelled')}
          className="filter-btn"
        >
          Cancelled ({orderStats.cancelled})
        </button>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div style={styles.emptyState}>
          <h3 style={styles.emptyTitle}>No Orders Found</h3>
          <p>
            {filterStatus === 'all' 
              ? 'You have no orders yet'
              : `No ${filterStatus} orders at the moment`
            }
          </p>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {filteredOrders.map(order => (
            <div key={order.order_id} style={styles.orderCard} className="order-card">
              <div style={styles.orderHeader}>
                <div style={styles.orderInfo}>
                  <h4 style={styles.orderId}>Order #{order.order_id}</h4>
                  <p style={styles.customerInfo}>
                    <strong>Customer:</strong> {order.customer_name}
                  </p>
                  <p style={styles.customerInfo}>
                    <strong>Email:</strong> {order.customer_email}
                  </p>
                  <p style={styles.orderDate}>
                    <strong>Date:</strong> {new Date(order.order_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div style={styles.shippingAddress}>
                    <strong>Shipping Address:</strong><br />
                    {order.shipping_address}
                  </div>
                </div>
                
                <div style={styles.orderActions}>
                  <div style={styles.statusBadge(order.status)}>
                    {getStatusLabel(order.status)}
                  </div>
                  {getNextStatus(order.status) && (
                    <button
                      style={styles.statusUpdateBtn}
                      className="status-update-btn"
                      onClick={() => updateOrderStatus(order.order_id, getNextStatus(order.status))}
                      disabled={updatingOrder === order.order_id}
                      onMouseEnter={(e) => {
                        if (updatingOrder !== order.order_id) {
                          e.target.style.background = '#1b5e20';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (updatingOrder !== order.order_id) {
                          e.target.style.background = '#2e7d32';
                        }
                      }}
                    >
                      {updatingOrder === order.order_id 
                        ? 'Updating...' 
                        : `Mark as ${getStatusLabel(getNextStatus(order.status))}`
                      }
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      style={styles.cancelBtn}
                      className="cancel-btn"
                      onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                      disabled={updatingOrder === order.order_id}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
              
              <div style={styles.orderItems}>
                <div style={styles.itemsHeader}>
                  <span>Order Items ({order.items.length})</span>
                  <button 
                    style={styles.expandBtn}
                    className="expand-btn"
                    onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                  >
                    {expandedOrder === order.order_id ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                {(expandedOrder === order.order_id || order.items.length <= 3) && order.items.map(item => (
                  <div key={item.order_item_id} style={styles.orderItem} className="order-item">
                    <img 
                      src={item.image_url || '/placeholder.png'} 
                      alt={item.product_name} 
                      style={styles.itemImage} 
                    />
                    <div style={styles.itemDetails}>
                      <span style={styles.itemName}>{item.product_name}</span>
                      <span style={styles.itemQuantity}>Quantity: {item.quantity}</span>
                      <span style={styles.itemPrice}>Price: ₹{item.price} each</span>
                    </div>
                    <div style={styles.itemTotal}>
                      ₹{(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={styles.orderTotal}>
                Order Total: ₹{parseFloat(order.total_amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderManagement;