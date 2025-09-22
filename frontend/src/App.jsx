import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthForms from './components/AuthForms';
import AddProductForm from './components/AddProductForm';
import EditProfile from './components/EditProfile';
import ProductList from './components/ProductList';
import FarmerDashboard from './components/FarmerDashboard';
import UserDashboard from './components/UserDashboard';
import Orders from './components/Orders';
import Cart from './components/Cart';

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

function App() {
  const [auth, setAuth] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setAuth({
          token,
          userType: decoded.role,
          userId: decoded.userId,
          username: decoded.username
        });
      } else {
        localStorage.removeItem('token');
      }
    }
    
    // Fetch categories
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleLogin = (authData) => {
    setAuth(authData);
    if (authData.userType === 'farmer') {
      setCurrentView('farmerDashboard');
    } else {
      setCurrentView('userDashboard');
    }
  };

  const handleLogout = () => {
    setAuth(null);
    setCart([]);
    localStorage.removeItem('token');
    setCurrentView('products');
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.product_id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: quantity }
          : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const setView = (view) => {
    if (view === 'login' && !auth) {
      setCurrentView('login');
    } else if (view === 'cart') {
      setCurrentView('cart');
    } else if (view === 'orders') {
      setCurrentView('orders');
    } else if (auth && view === 'profile') {
      setCurrentView('profile');
    } else if (auth && view === 'farmerDashboard' && auth.userType === 'farmer') {
      setCurrentView('farmerDashboard');
    } else if (auth && view === 'userDashboard' && auth.userType === 'customer') {
      setCurrentView('userDashboard');
    } else {
      setCurrentView('products');
    }
  };

  const styles = {
    app: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      backgroundColor: '#f8f9fa',
      color: '#333',
      lineHeight: 1.6
    },
    mainContainer: {
      width: '90%',
      maxWidth: '1200px',
      margin: '0 auto',
      flex: 1,
      padding: '2rem 0'
    }
  };

  return (
    <div className="App" style={styles.app}>
      <Header 
        auth={auth} 
        setAuth={setAuth} 
        setView={setView} 
        onLogout={handleLogout}
        cartCount={cart.reduce((total, item) => total + item.quantity, 0)}
      />
      
      <main className="container" style={styles.mainContainer}>
        {currentView === 'login' && !auth && (
          <AuthForms onLoginSuccess={handleLogin} />
        )}
        
        {auth && currentView === 'profile' && (
          <EditProfile auth={auth} />
        )}
        
        {auth && currentView === 'farmerDashboard' && (
          <FarmerDashboard auth={auth} />
        )}
        
        {auth && currentView === 'userDashboard' && (
          <UserDashboard auth={auth} />
        )}
        
        {currentView === 'cart' && (
          <Cart 
            cart={cart} 
            removeFromCart={removeFromCart}
            updateCartQuantity={updateCartQuantity}
            clearCart={clearCart}
            auth={auth}
            setView={setView}
          />
        )}
        
        {currentView === 'orders' && (
          <Orders auth={auth} />
        )}
        
        {auth && auth.userType === 'farmer' && currentView === 'products' && (
          <AddProductForm categories={categories} />
        )}

        {currentView === 'products' && (
          <ProductList 
            auth={auth} 
            categories={categories}
            addToCart={addToCart}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;