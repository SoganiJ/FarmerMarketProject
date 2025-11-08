import React, { useState } from 'react';

function EditProductForm({ product, onProductUpdated, onCancel, auth }) {
  const [formData, setFormData] = useState({
    product_name: product.product_name || '',
    description: product.description || '',
    price: product.price || '',
    category: product.category || '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState(
    product.image_url ? `http://localhost:3001/uploads/${product.image_url}` : null
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      setError('');

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    setError('');
  };

  const validateForm = () => {
    if (!formData.product_name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return false;
    }
    if (!formData.category.trim()) {
      setError('Category is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    const data = new FormData();
    data.append('product_name', formData.product_name.trim());
    data.append('description', formData.description.trim());
    data.append('price', parseFloat(formData.price).toFixed(2));
    data.append('category', formData.category.trim());
    
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      const response = await fetch(`http://localhost:3001/api/farmer/products/${product.product_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Product updated successfully!');
        setTimeout(() => {
          onProductUpdated();
        }, 1500);
      } else {
        setError(result.message || 'Error updating product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['fruit', 'vegetable', 'dairy', 'grains', 'herbs', 'meat', 'poultry', 'seafood', 'other'];

  return (
    <div className="stock-management-modal">
      <div className="stock-management-content">
        <div className="stock-header">
          <h3>Edit Product</h3>
          <button className="close-btn" onClick={onCancel} disabled={loading}>×</button>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="stock-form">
          <div className="form-grid">
            <div className="form-group">
              <label>
                Product Name *
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  disabled={loading}
                  required
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Price ({product.unit || 'units'}) *
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  disabled={loading}
                  required
                />
              </label>
            </div>

            <div className="form-group full-width">
              <label>
                Description *
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows="4"
                  disabled={loading}
                  required
                />
              </label>
            </div>

            <div className="form-group full-width">
              <label>
                Category *
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-group full-width">
              <label>
                Product Image
                <div className="file-input-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="file-input"
                  />
                  <span className="file-input-label">
                    {formData.image ? formData.image.name : 'Choose image...'}
                  </span>
                  <button type="button" className="file-browse-btn">
                    Browse
                  </button>
                </div>
                <small className="file-hint">Supported formats: JPG, PNG, WebP. Max size: 5MB</small>
              </label>

              {(imagePreview || product.image_url) && (
                <div className="image-preview-container">
                  <div className="image-preview">
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={removeImage}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                  {!formData.image && product.image_url && (
                    <small className="current-image-note">Current product image</small>
                  )}
                </div>
              )}
            </div>
          </div>

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
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductForm;