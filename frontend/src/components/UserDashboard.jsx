import React, { useState, useEffect } from 'react';

function UserDashboard({ auth, setView }) {
  const [userOrders, setUserOrders] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (auth && auth.token) {
      fetchUserData();
    }
  }, [auth]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await fetch('http://localhost:3001/api/profile', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      // Fetch user orders
      const ordersResponse = await fetch('http://localhost:3001/api/orders', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setUserOrders(ordersData);
        
        // Calculate user stats
        const stats = {
          totalOrders: ordersData.length,
          pendingOrders: ordersData.filter(order => 
            order.status === 'pending' || order.status === 'processing'
          ).length,
          totalSpent: ordersData.reduce((total, order) => 
            total + parseFloat(order.total_amount), 0
          )
        };
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await fetch('http://localhost:3001/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const result = await response.json();
        setUserProfile({ ...userProfile, ...updatedData });
        return { success: true, message: result.message };
      } else {
        const error = await response.json();
        return { success: false, message: error.message };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: 'Network error updating profile' };
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

  // --- INLINE STYLES ---
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: '0 1rem'
    },
    header: {
      textAlign: 'center',
      marginTop: 0,
      marginBottom: '2rem',
      color: '#2E7D32',
      fontSize: '2.5rem',
      fontWeight: '600'
    },
    welcomeCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '2rem',
      textAlign: 'center',
      border: '1px solid #e8f5e9'
    },
    welcomeText: {
      fontSize: '1.2rem',
      color: '#424242',
      margin: '0.5rem 0',
      lineHeight: '1.6'
    },
    tabsContainer: {
      display: 'flex',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '2rem',
      overflow: 'hidden'
    },
    tab: {
      flex: 1,
      padding: '1.2rem',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      color: '#666',
      transition: 'all 0.3s ease',
      borderBottom: '3px solid transparent'
    },
    activeTab: {
      color: '#2E7D32',
      background: '#f1f8e9',
      borderBottom: '3px solid #2E7D32'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    statCard: {
      background: 'white',
      borderRadius: '10px',
      padding: '1.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: '1px solid #e8f5e9'
    },
    statValue: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#2E7D32',
      margin: '0.5rem 0'
    },
    statLabel: {
      color: '#666',
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    ordersContainer: {
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    },
    orderCard: {
      padding: '1.5rem',
      borderBottom: '1px solid #f0f0f0',
      transition: 'background 0.3s ease'
    },
    orderCardHover: {
      background: '#f9f9f9'
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    orderId: {
      fontWeight: '600',
      color: '#333',
      fontSize: '1.1rem'
    },
    orderDate: {
      color: '#666',
      fontSize: '0.9rem'
    },
    orderStatus: {
      padding: '0.4rem 1rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '500',
      textTransform: 'capitalize'
    },
    orderTotal: {
      fontWeight: 'bold',
      color: '#2E7D32',
      fontSize: '1.1rem'
    },
    orderItems: {
      marginTop: '1rem'
    },
    orderItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 0',
      borderBottom: '1px solid #f8f8f8'
    },
    itemName: {
      flex: 1,
      color: '#333'
    },
    itemQuantity: {
      color: '#666',
      margin: '0 1rem'
    },
    itemTotal: {
      fontWeight: '500',
      color: '#2E7D32'
    },
    shippingAddress: {
      marginTop: '1rem',
      padding: '1rem',
      background: '#f8f9fa',
      borderRadius: '5px',
      fontSize: '0.9rem',
      color: '#666'
    },
    loading: {
      textAlign: 'center',
      padding: '3rem',
      color: '#666',
      fontSize: '1.1rem'
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#666'
    },
    actionButton: {
      padding: '0.8rem 1.5rem',
      background: '#2E7D32',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      transition: 'background 0.3s ease',
      margin: '0.5rem'
    },
    secondaryButton: {
      padding: '0.8rem 1.5rem',
      background: 'transparent',
      color: '#2E7D32',
      border: '2px solid #2E7D32',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      margin: '0.5rem'
    },
    profileSection: {
      background: 'white',
      borderRadius: '10px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    },
    profileField: {
      marginBottom: '1.5rem'
    },
    fieldLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#333'
    },
    fieldValue: {
      padding: '0.8rem',
      background: '#f8f9fa',
      borderRadius: '5px',
      border: '1px solid #e0e0e0',
      width: '100%',
      boxSizing: 'border-box'
    },
    fieldInput: {
      padding: '0.8rem',
      border: '1px solid #ddd',
      borderRadius: '5px',
      width: '100%',
      boxSizing: 'border-box',
      fontSize: '1rem'
    },
    message: {
      padding: '1rem',
      borderRadius: '5px',
      margin: '1rem 0',
      textAlign: 'center'
    },
    success: {
      background: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    error: {
      background: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    }
  };

  // Profile Edit Component
  const ProfileEditor = ({ profile, onSave, onCancel }) => {
    const [editData, setEditData] = useState(profile);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSave = async () => {
      setSaving(true);
      setMessage({ text: '', type: '' });
      
      const result = await onSave(editData);
      
      if (result.success) {
        setMessage({ text: result.message, type: 'success' });
        setTimeout(() => {
          onCancel();
        }, 2000);
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
      
      setSaving(false);
    };

    return (
      <div style={styles.profileSection}>
        <h3 style={{ marginTop: 0, marginBottom: '2rem' }}>Edit Profile</h3>
        
        {message.text && (
          <div style={{ ...styles.message, ...styles[message.type] }}>
            {message.text}
          </div>
        )}
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>First Name *</label>
          <input
            type="text"
            value={editData.first_name}
            onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
            style={styles.fieldInput}
            required
          />
        </div>
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>Last Name *</label>
          <input
            type="text"
            value={editData.last_name}
            onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
            style={styles.fieldInput}
            required
          />
        </div>
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>Address</label>
          <textarea
            value={editData.address || ''}
            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
            style={{ ...styles.fieldInput, minHeight: '80px' }}
            placeholder="Enter your address"
          />
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            style={styles.actionButton}
            onClick={handleSave}
            disabled={saving || !editData.first_name || !editData.last_name}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            style={styles.secondaryButton}
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const [editingProfile, setEditingProfile] = useState(false);

  const renderOverview = () => (
    <div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{userStats.totalOrders}</div>
          <div style={styles.statLabel}>Total Orders</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{userStats.pendingOrders}</div>
          <div style={styles.statLabel}>Pending Orders</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>₹{userStats.totalSpent.toFixed(2)}</div>
          <div style={styles.statLabel}>Total Spent</div>
        </div>
      </div>

      <div style={styles.ordersContainer}>
        <h3 style={{ padding: '1.5rem', margin: 0, borderBottom: '1px solid #f0f0f0' }}>
          Recent Orders
        </h3>
        {userOrders.slice(0, 3).map(order => (
          <div key={order.order_id} style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <div>
                <div style={styles.orderId}>Order #{order.order_id}</div>
                <div style={styles.orderDate}>{formatDate(order.order_date)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  ...styles.orderStatus,
                  background: getStatusColor(order.status) + '20',
                  color: getStatusColor(order.status)
                }}>
                  {order.status}
                </span>
                <div style={styles.orderTotal}>₹{order.total_amount}</div>
              </div>
            </div>
            <div style={styles.orderItems}>
              {order.items && order.items.slice(0, 2).map(item => (
                <div key={item.order_item_id} style={styles.orderItem}>
                  <span style={styles.itemName}>{item.product_name}</span>
                  <span style={styles.itemQuantity}>× {item.quantity}</span>
                  <span style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {order.items && order.items.length > 2 && (
                <div style={{ textAlign: 'center', padding: '0.5rem', color: '#666' }}>
                  + {order.items.length - 2} more items
                </div>
              )}
            </div>
            {order.shipping_address && (
              <div style={styles.shippingAddress}>
                <strong>Shipping Address:</strong> {order.shipping_address}
              </div>
            )}
          </div>
        ))}
        {userOrders.length === 0 && (
          <div style={styles.emptyState}>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here!</p>
            <button 
              style={styles.actionButton}
              onClick={() => setView('products')}
            >
              Start Shopping
            </button>
          </div>
        )}
        {userOrders.length > 3 && (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <button 
              style={styles.secondaryButton}
              onClick={() => setActiveTab('orders')}
            >
              View All Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div style={styles.ordersContainer}>
      <h3 style={{ padding: '1.5rem', margin: 0, borderBottom: '1px solid #f0f0f0' }}>
        All Orders
      </h3>
      {userOrders.map(order => (
        <div key={order.order_id} style={styles.orderCard}>
          <div style={styles.orderHeader}>
            <div>
              <div style={styles.orderId}>Order #{order.order_id}</div>
              <div style={styles.orderDate}>{formatDate(order.order_date)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                ...styles.orderStatus,
                background: getStatusColor(order.status) + '20',
                color: getStatusColor(order.status)
              }}>
                {order.status}
              </span>
              <div style={styles.orderTotal}>${order.total_amount}</div>
            </div>
          </div>
          
          {order.shipping_address && (
            <div style={styles.shippingAddress}>
              <strong>Shipping Address:</strong> {order.shipping_address}
            </div>
          )}

          <div style={styles.orderItems}>
            {order.items && order.items.map(item => (
              <div key={item.order_item_id} style={styles.orderItem}>
                <span style={styles.itemName}>{item.product_name}</span>
                <span style={styles.itemQuantity}>× {item.quantity}</span>
                <span style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {userOrders.length === 0 && (
        <div style={styles.emptyState}>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet.</p>
          <button 
            style={styles.actionButton}
            onClick={() => setView('products')}
          >
            Start Shopping
          </button>
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    if (editingProfile) {
      return (
        <ProfileEditor
          profile={userProfile}
          onSave={updateProfile}
          onCancel={() => setEditingProfile(false)}
        />
      );
    }

    return (
      <div style={styles.profileSection}>
        <h3 style={{ marginTop: 0, marginBottom: '2rem' }}>Account Information</h3>
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>Username</label>
          <div style={styles.fieldValue}>
            {userProfile?.username}
          </div>
        </div>
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>Email Address</label>
          <div style={styles.fieldValue}>
            {userProfile?.email}
          </div>
        </div>
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>First Name</label>
          <div style={styles.fieldValue}>
            {userProfile?.first_name}
          </div>
        </div>
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>Last Name</label>
          <div style={styles.fieldValue}>
            {userProfile?.last_name}
          </div>
        </div>
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>Address</label>
          <div style={styles.fieldValue}>
            {userProfile?.address || 'No address provided'}
          </div>
        </div>
        
        <div style={styles.profileField}>
          <label style={styles.fieldLabel}>User Type</label>
          <div style={styles.fieldValue}>
            {userProfile?.user_type ? userProfile.user_type.charAt(0).toUpperCase() + userProfile.user_type.slice(1) : 'Customer'}
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            style={styles.actionButton}
            onClick={() => setEditingProfile(true)}
          >
            Edit Profile
          </button>
          <button 
            style={styles.secondaryButton}
            onClick={() => setView('chat')}
          >
            Chat Support
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>My Dashboard</h2>
      
      <div style={styles.welcomeCard}>
        <h3 style={{ margin: 0, color: '#2E7D32' }}>
          Welcome back, {userProfile?.first_name || auth.first_name}!
        </h3>
        <p style={styles.welcomeText}>
          From here you can view your order history, track your orders, and manage your account details.
        </p>
      </div>

      <div style={styles.tabsContainer}>
        <button 
          style={activeTab === 'overview' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          style={activeTab === 'orders' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          onClick={() => setActiveTab('orders')}
        >
          Order History
        </button>
        <button 
          style={activeTab === 'profile' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          onClick={() => setActiveTab('profile')}
        >
          Account Settings
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>
          Loading your dashboard...
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'profile' && renderProfile()}
        </>
      )}
    </div>
  );
}

export default UserDashboard;