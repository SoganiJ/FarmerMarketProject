import React, { useState, useEffect } from 'react';

function Orders({ auth }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (auth && auth.token) {
      fetchOrders();
    }
  }, [auth, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/orders', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (response.ok) {
        let data = await response.json();
        
        // Filter orders based on selected filter
        if (filter !== 'all') {
          data = data.filter(order => order.status === filter);
        }
        
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchOrders(); // Refresh orders
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'processing': return '#2196f3';
      case 'shipped': return '#4caf50';
      case 'delivered': return '#2E7D32';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
      color: '#2E7D32'
    },
    filters: {
      display: 'flex',
      justifyContent: 'center',
      gap: '0.5rem',
      marginBottom: '2rem',
      flexWrap: 'wrap'
    },
    filterButton: {
      padding: '0.5rem 1rem',
      border: '1px solid #ddd',
      borderRadius: '20px',
      background: 'white',
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease'
    },
    activeFilter: {
      background: '#2E7D32',
      color: 'white',
      borderColor: '#2E7D32'
    },
    orderCard: {
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem',
      overflow: 'hidden'
    },
    orderHeader: {
      background: '#f8f9fa',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    orderDetails: {
      padding: '1.5rem'
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 0',
      borderBottom: '1px solid #f0f0f0'
    },
    itemImage: {
      width: '60px',
      height: '60px',
      objectFit: 'cover',
      borderRadius: '8px',
      marginRight: '1rem'
    },
    statusSelect: {
      padding: '0.5rem',
      borderRadius: '5px',
      border: '1px solid #ddd',
      background: 'white'
    },
    loading: {
      textAlign: 'center',
      padding: '2rem',
      color: '#666'
    },
    empty: {
      textAlign: 'center',
      padding: '3rem',
      color: '#666',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading orders...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Your Orders</h2>
      
      <div style={styles.filters}>
        <button 
          style={filter === 'all' ? {...styles.filterButton, ...styles.activeFilter} : styles.filterButton}
          onClick={() => setFilter('all')}
        >
          All Orders
        </button>
        <button 
          style={filter === 'pending' ? {...styles.filterButton, ...styles.activeFilter} : styles.filterButton}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          style={filter === 'processing' ? {...styles.filterButton, ...styles.activeFilter} : styles.filterButton}
          onClick={() => setFilter('processing')}
        >
          Processing
        </button>
        <button 
          style={filter === 'shipped' ? {...styles.filterButton, ...styles.activeFilter} : styles.filterButton}
          onClick={() => setFilter('shipped')}
        >
          Shipped
        </button>
        <button 
          style={filter === 'delivered' ? {...styles.filterButton, ...styles.activeFilter} : styles.filterButton}
          onClick={() => setFilter('delivered')}
        >
          Delivered
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={styles.empty}>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.order_id} style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <div>
                <strong>Order #{order.order_id}</strong>
                <div style={{fontSize: '0.9rem', color: '#666', marginTop: '0.25rem'}}>
                  {formatDate(order.order_date)}
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '15px',
                  background: '#f0f0f0',
                  color: getStatusColor(order.status),
                  fontWeight: '500',
                  fontSize: '0.8rem'
                }}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <strong>${order.total_amount}</strong>
              </div>
            </div>
            
            <div style={styles.orderDetails}>
              <div style={{marginBottom: '1rem'}}>
                <strong>Shipping Address:</strong>
                <p style={{margin: '0.5rem 0', color: '#666'}}>{order.shipping_address}</p>
              </div>
              
              <div>
                <strong>Items:</strong>
                {order.items && order.items.map(item => (
                  <div key={item.order_item_id} style={styles.itemRow}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      {item.image_url && (
                        <img 
                          src={`http://localhost:3001/uploads/${item.image_url}`} 
                          alt={item.product_name}
                          style={styles.itemImage}
                        />
                      )}
                      <div>
                        <div style={{fontWeight: '500'}}>{item.product_name}</div>
                        <div style={{fontSize: '0.9rem', color: '#666'}}>Sold by: {item.farmer_name}</div>
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div>${item.price} × {item.quantity}</div>
                      <div style={{fontWeight: '500', color: '#2E7D32'}}>${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {auth.userType === 'farmer' && (
                <div style={{marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0'}}>
                  <label style={{marginRight: '0.5rem', fontWeight: '500'}}>Update Status:</label>
                  <select 
                    style={styles.statusSelect}
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Orders;