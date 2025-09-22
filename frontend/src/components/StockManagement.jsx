import React, { useState } from 'react';

function StockManagement({ product, onStockUpdated, onCancel, auth }) {
  const [quantity, setQuantity] = useState('');
  const [action, setAction] = useState('add'); // 'add' or 'set'
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) return;
    
    setLoading(true);
    
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

      if (response.ok) {
        onStockUpdated();
      } else {
        console.error('Error updating stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Manage Stock for {product.product_name}</h3>
      <p>Current stock: {product.stock_quantity}</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <input
              type="radio"
              value="add"
              checked={action === 'add'}
              onChange={() => setAction('add')}
            />
            Add to current stock
          </label>
          <label>
            <input
              type="radio"
              value="set"
              checked={action === 'set'}
              onChange={() => setAction('set')}
            />
            Set specific amount
          </label>
        </div>
        <div>
          <label>
            {action === 'add' ? 'Quantity to add' : 'New stock quantity'}
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Stock'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default StockManagement;