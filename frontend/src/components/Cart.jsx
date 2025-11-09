import React, { useState } from 'react';

function Cart({ cart, removeFromCart, updateCartQuantity, clearCart, auth, setView }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderMessage, setOrderMessage] = useState({ text: '', type: '' });

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!auth || !auth.token) {
      setView('login');
      return;
    }

    if (!shippingAddress.trim()) {
      setOrderMessage({ text: 'Please enter a shipping address', type: 'error' });
      return;
    }

    setIsCheckingOut(true);
    setOrderMessage({ text: '', type: '' });

    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: calculateTotal(),
        shipping_address: shippingAddress
      };

      const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/orders`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    },
    body: JSON.stringify(orderData)
  }
);


      const data = await response.json();
      console.log('Order API Response:', data); // Debug log

      if (response.ok) {
        setOrderMessage({ text: 'Order placed successfully!', type: 'success' });
        
        // Save complete order data to localStorage for OrderSuccess component
        localStorage.setItem('lastOrder', JSON.stringify({
          orderId: data.orderId,
          orderNumber: data.orderNumber, // THIS IS THE KEY FIX - get orderNumber from API response
          totalAmount: data.totalAmount,
          items: cart.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            image_url: item.image_url,
            farmer_name: `${item.first_name || ''} ${item.last_name || ''}`.trim()
          })),
          shippingAddress: shippingAddress,
          orderDate: new Date().toISOString(),
          status: 'confirmed'
        }));
        
        clearCart();
        setShippingAddress('');
        
        setTimeout(() => {
          setView('orderSuccess');
        }, 1500);
      } else {
        setOrderMessage({ text: data.message || 'Failed to place order', type: 'error' });
      }
    } catch (error) {
      setOrderMessage({ text: 'Error placing order', type: 'error' });
      console.error('Checkout error:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 1rem'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
      color: '#2E7D32',
      fontSize: '2.5rem',
      fontWeight: '600'
    },
    emptyCart: {
      textAlign: 'center',
      padding: '3rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: '1px solid #e8eaed'
    },
    emptyTitle: {
      color: '#2E7D32',
      marginBottom: '1rem'
    },
    cartItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '1.5rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '1rem',
      gap: '1.5rem',
      border: '1px solid #e8eaed',
      transition: 'transform 0.2s ease'
    },
    itemImage: {
      width: '100px',
      height: '100px',
      objectFit: 'cover',
      borderRadius: '8px',
      flexShrink: 0
    },
    itemDetails: {
      flex: 1
    },
    itemName: {
      margin: '0 0 0.5rem 0',
      color: '#2c3e33',
      fontSize: '1.2rem',
      fontWeight: '600'
    },
    itemPrice: {
      color: '#2E7D32',
      fontWeight: 'bold',
      margin: '0 0 0.5rem 0',
      fontSize: '1.1rem'
    },
    itemFarmer: {
      color: '#666',
      fontSize: '0.9rem',
      margin: '0 0 0.5rem 0'
    },
    quantityControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '0.5rem'
    },
    quantityButton: {
      width: '35px',
      height: '35px',
      border: '1px solid #ddd',
      background: 'white',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1.2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
    },
    quantityInput: {
      width: '60px',
      textAlign: 'center',
      padding: '0.5rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '1rem',
      fontWeight: '500'
    },
    removeButton: {
      background: '#f44336',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    summary: {
      background: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginTop: '2rem',
      border: '1px solid #e8eaed'
    },
    summaryTitle: {
      margin: '0 0 1.5rem 0',
      color: '#2c3e33',
      fontSize: '1.5rem',
      fontWeight: '600'
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.75rem 0',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '1rem'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '1.5rem 0',
      borderTop: '2px solid #e0e0e0',
      fontWeight: 'bold',
      fontSize: '1.3rem',
      color: '#2E7D32'
    },
    checkoutButton: {
      width: '100%',
      padding: '1.2rem',
      background: '#2E7D32',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '1.5rem',
      opacity: isCheckingOut ? 0.7 : 1,
      transition: 'all 0.3s ease'
    },
    addressInput: {
      width: '100%',
      padding: '1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '1rem',
      marginTop: '0.5rem',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease',
      fontFamily: 'inherit'
    },
    message: {
      padding: '1rem',
      borderRadius: '8px',
      margin: '1rem 0',
      textAlign: 'center',
      fontWeight: '500'
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
    },
    clearButton: {
      background: '#666',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '1.5rem',
      fontSize: '1rem',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    continueShopping: {
      background: '#1976d2',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1.1rem',
      fontWeight: '600',
      marginTop: '1rem',
      transition: 'all 0.3s ease'
    }
  };

  if (cart.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>Shopping Cart</h2>
        <div style={styles.emptyCart}>
          <h3 style={styles.emptyTitle}>Your cart is empty</h3>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Add some fresh farm products to get started!</p>
          <button 
            style={styles.continueShopping}
            onClick={() => setView('products')}
            onMouseEnter={(e) => e.target.style.background = '#1565c0'}
            onMouseLeave={(e) => e.target.style.background = '#1976d2'}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Shopping Cart</h2>
      
      <button 
        style={styles.clearButton}
        onClick={clearCart}
        onMouseEnter={(e) => e.target.style.background = '#555'}
        onMouseLeave={(e) => e.target.style.background = '#666'}
      >
        Clear Cart
      </button>
      
      {cart.map(item => (
        <div 
          key={item.product_id} 
          style={styles.cartItem}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {item.image_url && (
            <img 
              src={item.image_url} 
              alt={item.product_name}
              style={styles.itemImage}
            />
          )}
          <div style={styles.itemDetails}>
            <h4 style={styles.itemName}>{item.product_name}</h4>
            <p style={styles.itemPrice}>₹{item.price}</p>
            {item.first_name && (
              <p style={styles.itemFarmer}>
                Sold by: {item.first_name} {item.last_name}
              </p>
            )}
            <div style={styles.quantityControls}>
              <button 
                style={styles.quantityButton}
                onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                -
              </button>
              <input 
                type="number" 
                value={item.quantity}
                onChange={(e) => updateCartQuantity(item.product_id, parseInt(e.target.value) || 1)}
                style={styles.quantityInput}
                min="1"
              />
              <button 
                style={styles.quantityButton}
                onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                +
              </button>
            </div>
          </div>
          <div style={{textAlign: 'right', minWidth: '120px'}}>
            <div style={{fontWeight: 'bold', color: '#2E7D32', marginBottom: '1rem', fontSize: '1.2rem'}}>
              ₹{(item.price * item.quantity).toFixed(2)}
            </div>
            <button 
              style={styles.removeButton}
              onClick={() => removeFromCart(item.product_id)}
              onMouseEnter={(e) => e.target.style.background = '#d32f2f'}
              onMouseLeave={(e) => e.target.style.background = '#f44336'}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      
      <div style={styles.summary}>
        <h3 style={styles.summaryTitle}>Order Summary</h3>
        
        {cart.map(item => (
          <div key={item.product_id} style={styles.summaryRow}>
            <span>{item.product_name} × {item.quantity}</span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        
        <div style={styles.totalRow}>
          <span>Total Amount:</span>
          <span>₹{calculateTotal().toFixed(2)}</span>
        </div>
        
        {!auth && (
          <div style={{...styles.message, ...styles.error}}>
            Please <span 
              style={{cursor: 'pointer', textDecoration: 'underline', fontWeight: '600'}} 
              onClick={() => setView('login')}
            >login</span> to checkout
          </div>
        )}
        
        {auth && (
          <>
            <div style={{marginTop: '1.5rem'}}>
              <label style={{fontWeight: '600', color: '#333'}}>
                <strong>Shipping Address:</strong>
                <textarea 
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your complete shipping address including pincode..."
                  style={styles.addressInput}
                  rows="3"
                  required
                  onFocus={(e) => e.target.style.borderColor = '#2E7D32'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </label>
            </div>
            
            {orderMessage.text && (
              <div style={{...styles.message, ...styles[orderMessage.type]}}>
                {orderMessage.text}
              </div>
            )}
            
            <button 
              style={styles.checkoutButton}
              onClick={handleCheckout}
              disabled={isCheckingOut}
              onMouseEnter={(e) => !isCheckingOut && (e.target.style.background = '#1B5E20')}
              onMouseLeave={(e) => !isCheckingOut && (e.target.style.background = '#2E7D32')}
            >
              {isCheckingOut ? 'Processing Order...' : 'Proceed to Checkout'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;