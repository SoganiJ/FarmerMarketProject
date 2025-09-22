// In frontend/src/components/Footer.jsx
import React from 'react';

function Footer() {

  // --- INLINE STYLES ---
  const styles = {
    siteFooter: {
      backgroundColor: '#333',
      color: '#aaa',
      padding: '2rem 0',
      textAlign: 'center',
      fontSize: '0.9rem',
      marginTop: 'auto' // Pushes footer to the bottom
    },
    text: {
      margin: '0.25rem 0'
    }
  };
  // --- END INLINE STYLES ---

  return (
    <footer style={styles.siteFooter}>
      <p style={styles.text}>© 2025 Farmer's Market. All rights reserved.</p>
      <p style={styles.text}>Connecting local farms with local people.</p>
    </footer>
  );
}

export default Footer;