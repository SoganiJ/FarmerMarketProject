import React, { useState } from 'react';

// This component receives a single 'product' object as a prop
function ProductCard({ product }) {
  // NEW: State to manage the button's hover effect in a React-idiomatic way
  const [isHovered, setIsHovered] = useState(false);

  // --- STYLES ---
  const styles = {
    productCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #e0e0e0',
    },
    productImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      backgroundColor: '#f5f5f5',
    },
    productInfo: {
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
    },
    productName: {
      fontSize: '1.2rem',
      fontWeight: 600,
      color: '#333',
      margin: '0 0 0.5rem',
    },
    productDesc: {
      fontSize: '0.9rem',
      color: '#666',
      lineHeight: 1.5,
      marginBottom: '1rem',
      flexGrow: 1,
    },
    productDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    productPrice: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#2E7D32',
    },
    productStock: {
      fontSize: '0.85rem',
      color: '#757575',
      backgroundColor: '#f0f4f0',
      padding: '0.25rem 0.5rem',
      borderRadius: '6px',
    },
    productFarmer: {
      fontSize: '0.9rem',
      color: '#555',
      marginBottom: '1.25rem',
    },
    farmerName: {
        color: '#333',
    },
    buyButton: {
      width: '100%',
      padding: '0.8rem',
      backgroundColor: '#2E7D32',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease', // This transition will now work correctly
      marginTop: 'auto',
    },
    // NEW: Style object specifically for the button's hover state
    buyButtonHover: {
      backgroundColor: '#1b5e20',
    }
  };

  // CORRECTED: Safely encode the product name to prevent broken URLs
  const encodedProductName = encodeURIComponent(product.product_name || 'Product');
  const placeholderImage = `https://placehold.co/600x400/a7e0a9/2E7D32?text=${encodedProductName}`;

  const imageUrl = product.image_url || placeholderImage;
  
  // CORRECTED: Safely parse the price, defaulting to 0 if it's not a valid number
  const formattedPrice = (parseFloat(product.price) || 0).toFixed(2);

  return (
    <div style={styles.productCard}>
      <img
        src={imageUrl}
        alt={`Image of ${product.product_name || 'a product'}`} // More descriptive alt text
        style={styles.productImage}
        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
      />

      <div style={styles.productInfo}>
        <h3 style={styles.productName}>{product.product_name || 'Unnamed Product'}</h3>

        <p style={styles.productDesc}>{product.description}</p>

        <div style={styles.productDetails}>
          <span style={styles.productPrice}>
            ₹{formattedPrice} {product.unit ? `/ ${product.unit}` : ''}
          </span>
          <span style={styles.productStock}>{product.stock_quantity} available</span>
        </div>

        <p style={styles.productFarmer}>Sold by: <strong style={styles.farmerName}>{product.farmer_name || 'FarmFresh User'}</strong></p>

        <button 
          // CORRECTED: Applying hover style based on component state
          style={{ ...styles.buyButton, ...(isHovered ? styles.buyButtonHover : {}) }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;

