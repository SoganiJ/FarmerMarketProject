// In frontend/src/components/UserDashboard.jsx
import React from 'react';

function UserDashboard() {

  // --- INLINE STYLES ---
  const styles = {
    container: {
      maxWidth: '900px',
      margin: '2rem auto',
      padding: '2rem',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    header: {
      textAlign: 'center',
      marginTop: 0,
      color: '#2E7D32'
    }
  };
  // --- END INLINE STYLES ---

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>My Dashboard</h2>
      <p>Welcome! From here you can view your order history and manage your account details.</p>
      {/* You can add more components here later, e.g.:
        - A list of your past orders
        - A link to the "Edit Profile" page
      */}
    </div>
  );
}

export default UserDashboard;