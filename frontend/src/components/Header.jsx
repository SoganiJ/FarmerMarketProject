import React, { useState, useEffect } from 'react';
import ChatBot from './ChatBot';

function Header({ auth, setAuth, setView, cart }) {
  const [showChat, setShowChat] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    setMobileMenuOpen(false);
  };

  const handleNavClick = (view) => {
    setView(view);
    setMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setView('profile');
    setMobileMenuOpen(false);
  };

  const styles = {
    siteHeader: {
      backgroundColor: scrolled 
        ? 'rgba(46, 125, 50, 0.95)' 
        : 'rgba(46, 125, 50, 1)',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      color: 'white',
      padding: scrolled ? '0.75rem 0' : '1rem 0',
      boxShadow: scrolled 
        ? '0 4px 12px rgba(0,0,0,0.15)' 
        : '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    },
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '90%',
      maxWidth: '1400px',
      margin: '0 auto',
      position: 'relative'
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoIcon: {
      fontSize: '1.8rem',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
    },
    logo: {
      margin: 0,
      fontSize: scrolled ? '1.6rem' : '1.8rem',
      cursor: 'pointer',
      fontWeight: '700',
      letterSpacing: '-0.5px',
      transition: 'all 0.3s ease',
      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    mainNav: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    mobileMenuButton: {
      display: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      padding: '0.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1.5rem',
      transition: 'all 0.2s ease'
    },
    navLink: {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      padding: '0.6rem 1.2rem',
      fontSize: '0.95rem',
      fontWeight: '500',
      borderRadius: '8px',
      textDecoration: 'none',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    navButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      cursor: 'pointer',
      padding: '0.6rem 1.2rem',
      fontSize: '0.95rem',
      fontWeight: '500',
      borderRadius: '8px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    dashboardButton: {
      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 179, 0, 0.2))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 193, 7, 0.4)',
      color: '#FFC107',
      cursor: 'pointer',
      padding: '0.6rem 1.2rem',
      fontSize: '0.95rem',
      fontWeight: '600',
      borderRadius: '8px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
    },
    logoutButton: {
      background: 'linear-gradient(135deg, #FFC107, #FFB300)',
      border: 'none',
      color: '#2c3e33',
      cursor: 'pointer',
      padding: '0.6rem 1.4rem',
      fontSize: '0.95rem',
      fontWeight: '600',
      borderRadius: '8px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
    },
    krushiSathiButton: {
      background: 'linear-gradient(135deg, #66BB6A, #4CAF50)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      cursor: 'pointer',
      padding: '0.6rem 1.2rem',
      fontSize: '0.95rem',
      fontWeight: '600',
      borderRadius: '8px',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
    },
    cartButton: {
      position: 'relative',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      cursor: 'pointer',
      padding: '0.6rem 1.2rem',
      fontSize: '0.95rem',
      fontWeight: '500',
      borderRadius: '8px',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    cartBadge: {
      position: 'absolute',
      top: '-6px',
      right: '-6px',
      background: 'linear-gradient(135deg, #FFC107, #FFB300)',
      color: '#2c3e33',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      fontSize: '0.75rem',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(255, 193, 7, 0.4)',
      border: '2px solid rgba(46, 125, 50, 1)'
    },
    userProfileButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginRight: '0.5rem',
      padding: '0.6rem 1rem',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      color: 'white',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    userAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #66BB6A, #4CAF50)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9rem',
      fontWeight: '600',
      color: 'white',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
    },
    userInfo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.1rem'
    },
    userName: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: 'white',
      lineHeight: '1.2'
    },
    userType: {
      fontSize: '0.7rem',
      fontWeight: '500',
      color: '#e8f5e9',
      opacity: '0.9',
      textTransform: 'capitalize',
      lineHeight: '1'
    }
  };

  const cartItemCount = cart ? cart.reduce((total, item) => total + item.quantity, 0) : 0;

  return (
    <>
      <style>
        {`
          @media (max-width: 968px) {
            .main-nav {
              display: ${mobileMenuOpen ? 'flex' : 'none'} !important;
              position: absolute;
              top: 100%;
              right: 0;
              background: rgba(46, 125, 50, 0.98);
              backdrop-filter: blur(10px);
              flex-direction: column;
              padding: 1rem;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 8px 16px rgba(0,0,0,0.2);
              min-width: 250px;
              gap: 0.75rem !important;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .mobile-menu-btn {
              display: flex !important;
              align-items: center;
              justify-content: center;
            }
            .user-profile-btn {
              flex-direction: row !important;
              justify-content: flex-start !important;
            }
          }
        `}
      </style>

      <header style={styles.siteHeader}>
        <div style={styles.container}>
          <div style={styles.logoSection}>
            <span style={styles.logoIcon}>🌾</span>
            <h1 
              style={styles.logo} 
              onClick={() => handleNavClick('products')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.color = '#e8f5e9';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.color = 'white';
              }}
            >
              Farmer's Market
            </h1>
          </div>

          <button 
            className="mobile-menu-btn"
            style={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          <nav className="main-nav" style={styles.mainNav}>
            {/* Clickable User Profile Button */}
            {auth && (
              <button 
                className="user-profile-btn"
                style={styles.userProfileButton}
                onClick={handleProfileClick}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                <div style={styles.userAvatar}>
                  {auth.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={styles.userInfo}>
                  <span style={styles.userName}>
                    {auth.firstName || 'User'}
                  </span>
                  <span style={styles.userType}>
                    {auth.userType === 'farmer' ? 'Farmer' : 'Customer'}
                  </span>
                </div>
              </button>
            )}

            {/* Products Link - Only for Customers and Non-logged in users */}
            {(!auth || auth.userType === 'customer') && (
              <button 
                style={styles.navLink}
                onClick={() => handleNavClick('products')}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Products
              </button>
            )}

            {/* Cart Button - Only for Customers */}
            {auth && auth.userType === 'customer' && (
              <button 
                style={styles.cartButton}
                onClick={() => handleNavClick('cart')}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                🛒 Cart
                {cartItemCount > 0 && (
                  <span style={styles.cartBadge}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>
            )}

            {auth ? (
              <>
                {/* Krushi Sathi Button - Only for Farmers */}
                {auth.userType === 'farmer' && (
                  <button 
                    style={styles.krushiSathiButton}
                    onClick={() => {
                      setShowChat(true);
                      setMobileMenuOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
                    }}
                  >
                    <span>Krushi Sathi</span>
                    <span>🌱</span>
                  </button>
                )}

                <button 
                  style={styles.dashboardButton}
                  onClick={handleDashboardClick}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
                    e.target.style.background = 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 179, 0, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.2)';
                    e.target.style.background = 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 179, 0, 0.2))';
                  }}
                >
                  Dashboard
                </button>
                
                <button 
                  style={styles.logoutButton}
                  onClick={handleLogout}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px) scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.3)';
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                style={styles.logoutButton}
                onClick={() => handleNavClick('login')}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.3)';
                }}
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Chat Bot Modal */}
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