// In frontend/src/components/Header.jsx
import React, { useState } from 'react';
import ChatBot from './ChatBot';

function Header({ auth, setAuth, setView }) {
  const [showChat, setShowChat] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('token'); 
    setAuth(null); 
    setView('products'); 
  };

  const handleDashboardClick = () => {
    if (auth.userType === 'farmer') {
      setView('farmerDashboard');
    } else {
      setView('userDashboard');
    }
  };

  const baseButtonStyles = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '1.5rem',
    fontSize: '1rem',
    fontWeight: 500,
    borderRadius: '5px',
    padding: '0.5rem 1rem',
    textDecoration: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease'
  };

  const styles = {
    siteHeader: {
      backgroundColor: '#2E7D32',
      color: 'white',
      padding: '1rem 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      zIndex: 100
    },
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '90%',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    logo: {
      margin: 0,
      fontSize: '1.8rem',
      cursor: 'pointer',
      fontWeight: '700',
      letterSpacing: '-0.5px'
    },
    mainNav: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    navLink: {
      ...baseButtonStyles,
      color: 'white',
      padding: '0.5rem 1rem',
      marginLeft: '0',
      borderRadius: '5px',
      transition: 'all 0.3s ease'
    },
    navLinkButton: {
      ...baseButtonStyles,
      color: 'white',
      border: '1px solid transparent',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)'
      }
    },
    navButtonPrimary: {
      ...baseButtonStyles,
      backgroundColor: '#FFC107',
      color: '#333',
      fontWeight: '600',
      '&:hover': {
        backgroundColor: '#FFB300',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
      }
    },
    navButtonSecondary: {
      ...baseButtonStyles,
      border: '1px solid #FFC107',
      color: '#FFC107',
      '&:hover': {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        transform: 'translateY(-2px)'
      }
    },
    krushiSathiButton: {
      ...baseButtonStyles,
      backgroundColor: '#4CAF50',
      color: 'white',
      border: '1px solid #45a049',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      '&:hover': {
        backgroundColor: '#45a049',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
      }
    }
  };

  // Add hover effects dynamically
  const addHoverEffects = (baseStyle, hoverStyle) => ({
    ...baseStyle,
    ':hover': hoverStyle
  });

  return (
    <>
      <header style={styles.siteHeader}>
        <div style={styles.container}>
          <h1 
            style={styles.logo} 
            onClick={() => setView('products')}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.8';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Farmer's Market
          </h1>
          <nav style={styles.mainNav}>
            
            {/* ✅ Products visible only if logged in as CUSTOMER */}
            {auth && auth.userType === 'customer' && (
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setView('products'); }} 
                style={{
                  ...styles.navLink,
                  ':hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Products
              </a>
            )}

            {auth ? (
              <>
                {/* Krushi Sathi Button - Only for Farmers */}
                {auth.userType === 'farmer' && (
                  <button 
                    style={styles.krushiSathiButton}
                    onClick={() => setShowChat(true)}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#45a049';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#4CAF50';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>Krushi Sathi</span>
                    <span>🌱</span>
                  </button>
                )}

                <button 
                  style={styles.navButtonSecondary}
                  onClick={handleDashboardClick}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  My Dashboard
                </button>

                <button 
                  style={styles.navLinkButton}
                  onClick={() => setView('profile')}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = 'transparent';
                  }}
                >
                  Edit Profile
                </button>
                
                <button 
                  style={styles.navButtonPrimary}
                  onClick={handleLogout}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#FFB300';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FFC107';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                style={styles.navButtonPrimary}
                onClick={() => setView('login')}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#FFB300';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FFC107';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Chat Bot Modal - Only show when farmer is logged in and chat is active */}
      {showChat && auth && auth.userType === 'farmer' && (
        <ChatBot 
          auth={auth} 
          onClose={() => setShowChat(false)} 
        />
      )}
    </>
  );
}

export default Header;