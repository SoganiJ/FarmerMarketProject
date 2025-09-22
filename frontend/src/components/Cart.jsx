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

      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (response.ok) {
        setOrderMessage({ text: 'Order placed successfully!', type: 'success' });
        clearCart();
        setShippingAddress('');
        setTimeout(() => {
          setView('orders');
        }, 2000);
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
      color: '#2E7D32'
    },
    emptyCart: {
      textAlign: 'center',
      padding: '3rem',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    cartItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '1.5rem',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '1rem',
      gap: '1.5rem'
    },
    itemImage: {
      width: '80px',
      height: '80px',
      objectFit: 'cover',
      borderRadius: '8px'
    },
    itemDetails: {
      flex: 1
    },
    itemName: {
      margin: '0 0 0.5rem 0',
      color: '#333'
    },
    itemPrice: {
      color: '#2E7D32',
      fontWeight: 'bold',
      margin: '0 0 0.5rem 0'
    },
    quantityControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    quantityButton: {
      width: '30px',
      height: '30px',
      border: '1px solid #ddd',
      background: 'white',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    quantityInput: {
      width: '50px',
      textAlign: 'center',
      padding: '0.25rem',
      border: '1px solid #ddd',
      borderRadius: '4px'
    },
    removeButton: {
      background: '#f44336',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '0.9rem'
    },
    summary: {
      background: 'white',
      padding: '2rem',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginTop: '2rem'
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.5rem 0',
      borderBottom: '1px solid #f0f0f0'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '1rem 0',
      borderTop: '2px solid #e0e0e0',
      fontWeight: 'bold',
      fontSize: '1.2rem',
      color: '#2E7D32'
    },
    checkoutButton: {
      width: '100%',
      padding: '1rem',
      background: '#2E7D32',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '1.5rem',
      opacity: isCheckingOut ? 0.7 : 1
    },
    addressInput: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontSize: '1rem',
      marginTop: '0.5rem',
      boxSizing: 'border-box'
    },
    message: {
      padding: '1rem',
      borderRadius: '5px',
      margin: '1rem 0',
      textAlign: 'center'
    },
    success: {
      background: '#d4edda',
      color: '#155724'
    },
    error: {
      background: '#f8d7da',
      color: '#721c24'
    },
    clearButton: {
      background: '#666',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '5px',
      cursor: 'pointer',
      marginBottom: '1rem'
    }
  };

  if (cart.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>Shopping Cart</h2>
        <div style={styles.emptyCart}>
          <h3>Your cart is empty</h3>
          <p>Add some products to get started!</p>
          <button 
            style={{...styles.checkoutButton, background: '#1976d2', maxWidth: '200px'}}
            onClick={() => setView('products')}
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
      
      <button style={styles.clearButton} onClick={clearCart}>
        Clear Cart
      </button>
      
      {cart.map(item => (
        <div key={item.product_id} style={styles.cartItem}>
          {item.image_url && (
            <img 
              src={`http://localhost:3001/uploads/${item.image_url}`} 
              alt={item.name}
              style={styles.itemImage}
            />
          )}
          <div style={styles.itemDetails}>
            <h4 style={styles.itemName}>{item.name}</h4>
            <p style={styles.itemPrice}>${item.price}</p>
            <div style={styles.quantityControls}>
              <button 
                style={styles.quantityButton}
                onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
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
              >
                +
              </button>
            </div>
          </div>
          <div style={{textAlign: 'right'}}>
            <div style={{fontWeight: 'bold', color: '#2E7D32', marginBottom: '1rem'}}>
              ${(item.price * item.quantity).toFixed(2)}
            </div>
            <button 
              style={styles.removeButton}
              onClick={() => removeFromCart(item.product_id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      
      <div style={styles.summary}>
        <h3>Order Summary</h3>
        
        {cart.map(item => (
          <div key={item.product_id} style={styles.summaryRow}>
            <span>{item.name} × {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        
        <div style={styles.totalRow}>
          <span>Total:</span>
          <span>${calculateTotal().toFixed(2)}</span>
        </div>
        
        {!auth && (
          <div style={{...styles.message, ...styles.error}}>
            Please <span style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={() => setView('login')}>login</span> to checkout
          </div>
        )}
        
        {auth && (
          <>
            <div style={{marginTop: '1.5rem'}}>
              <label>
                <strong>Shipping Address:</strong>
                <textarea 
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your complete shipping address"
                  style={styles.addressInput}
                  rows="3"
                  required
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
            >
              {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;