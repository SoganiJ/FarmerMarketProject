import React, { useState } from 'react';

function AuthForms({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'customer',
    first_name: '',
    last_name: '',
    address: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleView = () => {
    setIsLogin(!isLogin);
    setMessage({ text: '', type: '' });
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      user_type: 'customer',
      first_name: '',
      last_name: '',
      address: ''
    });
  };

  const validateForm = () => {
    // General validations for both login and signup
    if (!formData.email.trim()) {
        setMessage({ text: "Email is required.", type: 'error' });
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        setMessage({ text: "Please enter a valid email address.", type: 'error' });
        return false;
    }

    if (!formData.password) {
        setMessage({ text: "Password is required.", type: 'error' });
        return false;
    }

    // Registration specific validations
    if (!isLogin) {
        if (!formData.username.trim()) {
            setMessage({ text: 'Username is required.', type: 'error' });
            return false;
        }

        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            setMessage({ text: "First name and last name are required.", type: 'error' });
            return false;
        }

        // Name validation (no numbers or special characters)
        const nameRegex = /^[A-Za-z]+$/;
        if (!nameRegex.test(formData.first_name) || !nameRegex.test(formData.last_name)) {
            setMessage({ text: "Names should only contain letters.", type: 'error' });
            return false;
        }
        
        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
             setMessage({ 
                 text: "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number.", 
                 type: 'error' 
                });
             return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage({ text: "Passwords do not match.", type: 'error' });
            return false;
        }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    const API_URL = import.meta.env.DEV
  ? "http://localhost:3001/api"
  : "https://farmermarketproject.onrender.com/api";

const url = isLogin
  ? `${API_URL}/login`
  : `${API_URL}/register`;


    const body = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          user_type: formData.user_type,
          first_name: formData.first_name,
          last_name: formData.last_name,
          address: formData.address
        };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        onLoginSuccess({ 
          token: data.token, 
          userType: data.userType,
          userId: data.userId,
          username: data.username
        });
      } else {
        setMessage({ text: data.message, type: 'success' });
        
        // Auto-login after registration
        if (data.token) {
          localStorage.setItem('token', data.token);
          onLoginSuccess({ 
            token: data.token, 
            userType: data.userType,
            userId: data.userId,
            username: data.username
          });
        } else {
          setIsLogin(true);
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '70vh',
      padding: '2rem 0'
    },
    form: {
      background: 'white',
      padding: '2rem',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px'
    },
    title: {
      textAlign: 'center',
      marginBottom: '1.5rem',
      color: '#2E7D32',
      fontSize: '1.8rem',
      fontWeight: '600'
    },
    formGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#2E7D32',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '1rem',
      opacity: isLoading ? 0.7 : 1
    },
    message: {
      padding: '0.75rem',
      borderRadius: '5px',
      marginTop: '1rem',
      textAlign: 'center',
      lineHeight: '1.4'
    },
    success: {
      backgroundColor: '#d4edda',
      color: '#155724'
    },
    error: {
      backgroundColor: '#f8d7da',
      color: '#721c24'
    },
    toggleText: {
      textAlign: 'center',
      marginTop: '1.5rem',
      color: '#666'
    },
    toggleLink: {
      color: '#2E7D32',
      cursor: 'pointer',
      fontWeight: '600'
    },
    row: {
      display: 'flex',
      gap: '1rem'
    },
    col: {
      flex: 1
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h2 style={styles.title}>{isLogin ? 'Login' : 'Create Account'}</h2>

        {!isLogin && (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="username">Username</label>
              <input
                style={styles.input}
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="first_name">First Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
              </div>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="last_name">Last Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            style={styles.input}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="password">Password</label>
          <input
            style={styles.input}
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {!isLogin && (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="confirmPassword">Confirm Password</label>
              <input
                style={styles.input}
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="user_type">I am a:</label>
              <select
                style={styles.input}
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
              >
                <option value="customer">Customer</option>
                <option value="farmer">Farmer</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="address">Address (Optional)</label>
              <textarea
                style={{...styles.input, minHeight: '80px'}}
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        <button 
          style={styles.button} 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>

        {message.text && (
          <div style={{...styles.message, ...styles[message.type]}}>
            {message.text}
          </div>
        )}

        <p style={styles.toggleText}>
          {isLogin
            ? "Don't have an account? "
            : 'Already have an account? '}
          <span style={styles.toggleLink} onClick={toggleView}>
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </form>
    </div>
  );
}

export default AuthForms;
