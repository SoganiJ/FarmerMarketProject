// In frontend/src/components/EditProfile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export default function EditProfile() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    email: '', // We show email but don't allow editing
    username: '' // We show username but don't allow editing
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // This token is needed for all secure API calls
  const token = localStorage.getItem('token');

  // On component load, fetch the user's current data
  useEffect(() => {
    const fetchProfile = async () => {
      setError('');
      if (!token) {
        setError("You must be logged in.");
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        // Pre-fill the form with the data from the DB
        setFormData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          address: response.data.address || '',
          email: response.data.email,
          username: response.data.username
        });
      } catch (err) {
        setError("Could not fetch profile data.");
      }
    };
    fetchProfile();
  }, [token]); // Re-run if token changes

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    // Send only the data we are allowed to change
    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      address: formData.address
    };

    try {
      const response = await axios.put(`${API_URL}/profile`, updateData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage(response.data.message); // "Profile updated successfully!"
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Edit Your Profile</h2>
        
        {/* Read-only fields */}
        <div className="form-group">
          <label>Username (read-only)</label>
          <input type="text" value={formData.username} readOnly disabled />
        </div>
        <div className="form-group">
          <label>Email (read-only)</label>
          <input type="email" value={formData.email} readOnly disabled />
        </div>
        
        {/* Editable fields */}
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <textarea name="address" id="address" value={formData.address} onChange={handleChange} />
        </div>
        
        <button type="submit">Save Changes</button>
        {message && <p className="auth-message success">{message}</p>}
        {error && <p className="auth-message error">{error}</p>}
      </form>
    </div>
  );
}