import React, { useState } from 'react';
import './StockManagement.css'; // We'll create this CSS file

function StockManagement({ product, onStockUpdated, onCancel, auth }) {
  const [quantity, setQuantity] = useState('');
  const [action, setAction] = useState('add'); // 'add' or 'set'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const calculateNewStock = () => {
    if (!quantity || isNaN(quantity)) return product.stock_quantity;
    
    const currentStock = parseInt(product.stock_quantity);
    const changeQuantity = parseInt(quantity);
    
    if (action === 'add') {
      return currentStock + changeQuantity;
    } else {
      return changeQuantity;
    }
  };

  const validateInput = () => {
    if (!quantity || quantity.trim() === '') {
      setError('Please enter a quantity');
      return false;
    }
    
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Please enter a valid positive number');
      return false;
    }
    
    if (action === 'set' && numQuantity === product.stock_quantity) {
      setError('New quantity is the same as current stock');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateInput()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`http://localhost:3001/api/farmer/products/${product.product_id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          quantity: parseInt(quantity),
          action
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Stock updated successfully! New stock: ${data.newStock}`);
        setTimeout(() => {
          onStockUpdated();
        }, 1500);
      } else {
        setError(data.message || 'Error updating stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const newStock = calculateNewStock();
  const isIncreasing = newStock > product.stock_quantity;
  const isDecreasing = newStock < product.stock_quantity;

  return (
    <div className="stock-management-modal">
      <div className="stock-management-content">
        <div className="stock-header">
          <h3>Manage Stock</h3>
          <button className="close-btn" onClick={onCancel} disabled={loading}>×</button>
        </div>
        
        <div className="product-info">
          <h4>{product.product_name}</h4>
          <p className="current-stock">Current Stock: <strong>{product.stock_quantity} {product.unit || 'units'}</strong></p>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="stock-form">
          <div className="action-selector">
            <label className="radio-label">
              <input
                type="radio"
                value="add"
                checked={action === 'add'}
                onChange={() => {
                  setAction('add');
                  setError('');
                }}
                disabled={loading}
              />
              <span className="radio-custom"></span>
              Add to current stock
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="set"
                checked={action === 'set'}
                onChange={() => {
                  setAction('set');
                  setError('');
                }}
                disabled={loading}
              />
              <span className="radio-custom"></span>
              Set specific amount
            </label>
          </div>

          <div className="quantity-input">
            <label>
              {action === 'add' ? 'Quantity to add' : 'New stock quantity'}
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                min="1"
                placeholder={`Enter ${action === 'add' ? 'quantity to add' : 'new quantity'}`}
                disabled={loading}
                required
              />
            </label>
          </div>

          {quantity && !error && (
            <div className="stock-preview">
              <div className={`preview-card ${isIncreasing ? 'increase' : isDecreasing ? 'decrease' : ''}`}>
                <span className="preview-label">New stock will be:</span>
                <span className="preview-value">{newStock} {product.unit || 'units'}</span>
                {isIncreasing && <span className="change-indicator">↑ Increase</span>}
                {isDecreasing && <span className="change-indicator">↓ Decrease</span>}
                {!isIncreasing && !isDecreasing && <span className="change-indicator">No change</span>}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !quantity || !!error}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Updating...
                </>
              ) : (
                'Update Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockManagement;