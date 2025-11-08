import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Download, Package, Calendar, MapPin, ShoppingBag, ArrowRight, Truck, Star, Heart, Zap, Clock, Shield, Phone, Mail } from 'lucide-react';

function OrderSuccess({ orderId, totalAmount, setView, auth }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const billRef = useRef();

  useEffect(() => {
    // Try to get order data from localStorage first (from cart)
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        console.log('Loaded order from localStorage:', order);
        setOrderData(order);
      } catch (error) {
        console.error('Error parsing saved order:', error);
      }
    } else if (auth && auth.token) {
      // If no localStorage data, fetch the latest order from API
      fetchLatestOrder();
    }
    fetchProductSuggestions();
    
    // Confetti effect
    setTimeout(() => setShowConfetti(false), 3000);
  }, [auth]);

  const fetchLatestOrder = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (response.ok) {
        const orders = await response.json();
        console.log('Fetched orders from API:', orders);
        if (orders.length > 0) {
          const latestOrder = orders[0];
          const orderData = {
            orderId: latestOrder.order_id,
            orderNumber: latestOrder.order_number, // Add order number
            totalAmount: latestOrder.total_amount,
            items: latestOrder.items,
            shippingAddress: latestOrder.shipping_address,
            orderDate: latestOrder.order_date,
            status: latestOrder.status
          };
          setOrderData(orderData);
          localStorage.setItem('lastOrder', JSON.stringify(orderData));
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const fetchProductSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await fetch('http://localhost:3001/api/products/suggestions?limit=8');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${getDisplayOrderNumber()}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 30px; 
            color: #2d3748;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .invoice-header { 
            background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          .invoice-title { 
            font-size: 36px; 
            margin: 0 0 10px 0;
            font-weight: 700;
          }
          .invoice-subtitle { 
            font-size: 18px; 
            margin: 0;
            opacity: 0.9;
          }
          .order-info { 
            padding: 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }
          .info-item {
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          .info-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
          }
          .bill-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 0;
          }
          .bill-table th { 
            background: #4CAF50;
            color: white; 
            padding: 15px; 
            text-align: left;
            font-weight: 600;
          }
          .bill-table td { 
            padding: 15px; 
            border-bottom: 1px solid #e2e8f0;
          }
          .bill-total { 
            background: #e8f5e8; 
            font-weight: bold; 
            font-size: 18px;
          }
          .total-section {
            padding: 30px;
            background: #f8f9fa;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0,
            border-bottom: 1px solid #e2e8f0;
          }
          .grand-total {
            font-size: 24px;
            font-weight: 700;
            color: #2E7D32;
            border-bottom: none;
            padding-top: 20px;
          }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #2d3748;
            color: white;
          }
          .footer p {
            margin: 5px 0;
          }
          @media print {
            body { 
              margin: 0;
              background: white;
            }
            .invoice-container {
              box-shadow: none;
              border-radius: 0;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <h1 class="invoice-title">ORDER CONFIRMED</h1>
            <p class="invoice-subtitle">FreshFarm Market - Invoice</p>
          </div>
          
          <div class="order-info">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Order Number</div>
                <div class="info-value">${getDisplayOrderNumber()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Order Date</div>
                <div class="info-value">${orderData?.orderDate ? new Date(orderData.orderDate).toLocaleString() : new Date().toLocaleString()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value" style="color: #2E7D32;">${orderData?.status || 'Confirmed'}</div>
              </div>
            </div>
          </div>
          
          <div style="padding: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #2d3748;">Order Items</h3>
            <table class="bill-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData?.items?.map(item => `
                  <tr>
                    <td>
                      <strong>${item.product_name}</strong>
                      ${item.farmer_name ? `<br><small>Sold by: ${item.farmer_name}</small>` : ''}
                    </td>
                    <td>₹${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
          
          <div class="total-section">
            <div class="total-row">
              <span>Items Total</span>
              <span>₹${getDisplayTotalAmount()}</span>
            </div>
            <div class="total-row">
              <span>Shipping</span>
              <span style="color: #2E7D32; font-weight: 600;">FREE</span>
            </div>
            <div class="total-row">
              <span>Tax</span>
              <span>₹0.00</span>
            </div>
            <div class="total-row grand-total">
              <span>Total Amount</span>
              <span>₹${getDisplayTotalAmount()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for shopping with FreshFarm Market!</p>
            <p>For any queries, contact: support@freshfarm.com | +91-9876543210</p>
            <p style="opacity: 0.8; font-size: 14px; margin-top: 15px;">
              Delivering farm-fresh goodness to your doorstep
            </p>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Get order number for display - UPDATED to prioritize localStorage
  const getDisplayOrderNumber = () => {
    console.log('Current orderData:', orderData);
    
    // First check localStorage for the order number (from Cart component)
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        if (parsedOrder.orderNumber) {
          return parsedOrder.orderNumber;
        }
      } catch (error) {
        console.error('Error parsing saved order:', error);
      }
    }
    
    // Then check orderData from state
    if (orderData?.orderNumber) {
      return orderData.orderNumber;
    }
    
    // Fallback to orderId
    if (orderData?.orderId) {
      return `ORD-TEMP-${orderData.orderId}`;
    }
    
    if (orderId) {
      return `ORD-TEMP-${orderId}`;
    }
    
    if (orderData?.items && orderData.items.length > 0) {
      return 'ORD-TEMP-' + Date.now().toString().slice(-6);
    }
    
    return 'Loading...';
  };

  const getDisplayTotalAmount = () => {
    if (orderData?.totalAmount) {
      return typeof orderData.totalAmount === 'number' 
        ? orderData.totalAmount.toFixed(2)
        : parseFloat(orderData.totalAmount).toFixed(2);
    }
    
    if (totalAmount) {
      return typeof totalAmount === 'number'
        ? totalAmount.toFixed(2)
        : parseFloat(totalAmount).toFixed(2);
    }
    
    if (orderData?.items && orderData.items.length > 0) {
      const calculatedTotal = orderData.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      return calculatedTotal.toFixed(2);
    }
    
    return '0.00';
  };

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

  const addToCart = (product) => {
    console.log('Add to cart:', product);
    setView('products');
  };

  const quickAddToCart = (product, e) => {
    e.stopPropagation();
    console.log('Quick add:', product);
  };

  // Debug: Log the current state
  useEffect(() => {
    console.log('OrderSuccess State:', {
      orderData,
      orderId,
      totalAmount,
      displayOrderNumber: getDisplayOrderNumber(),
      displayTotalAmount: getDisplayTotalAmount()
    });
  }, [orderData, orderId, totalAmount]);

  return (
    <div style={styles.container}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div style={styles.confetti}>
          {[...Array(50)].map((_, i) => (
            <div key={i} style={{
              ...styles.confettiPiece,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              background: ['#2E7D32', '#4CAF50', '#66BB6A', '#81C784'][Math.floor(Math.random() * 4)]
            }} />
          ))}
        </div>
      )}

      {/* Success Header */}
      <div style={styles.successCard}>
        <div style={styles.iconWrapper}>
          <CheckCircle size={80} color="#2E7D32" strokeWidth={1.5} />
        </div>
        <h1 style={styles.title}>Order Confirmed! 🎉</h1>
        <p style={styles.subtitle}>
          Thank you for your purchase! Your order <strong>{getDisplayOrderNumber()}</strong> has been confirmed 
          and is being processed. You'll receive a confirmation email shortly.
        </p>

        {/* Order Summary Cards */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              <Package size={28} color="#2E7D32" />
            </div>
            <div style={styles.summaryInfo}>
              <span style={styles.summaryLabel}>Order Number</span>
              <span style={styles.summaryValue}>{getDisplayOrderNumber()}</span>
            </div>
          </div>
          
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              <Calendar size={28} color="#2E7D32" />
            </div>
            <div style={styles.summaryInfo}>
              <span style={styles.summaryLabel}>Order Date</span>
              <span style={styles.summaryValue}>
                {orderData?.orderDate ? new Date(orderData.orderDate).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              <Clock size={28} color="#2E7D32" />
            </div>
            <div style={styles.summaryInfo}>
              <span style={styles.summaryLabel}>Est. Delivery</span>
              <span style={styles.summaryValue}>{estimatedDelivery.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div style={styles.trustIndicators}>
          <div style={styles.trustItem}>
            <Shield size={20} color="#4CAF50" />
            <span>Secure Payment</span>
          </div>
          <div style={styles.trustItem}>
            <Truck size={20} color="#4CAF50" />
            <span>Free Delivery</span>
          </div>
          <div style={styles.trustItem}>
            <Phone size={20} color="#4CAF50" />
            <span>24/7 Support</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button 
            style={styles.primaryButton} 
            onClick={() => setView('products')}
          >
            <ShoppingBag size={20} />
            Continue Shopping
          </button>
          <button 
            style={styles.secondaryButton} 
            onClick={() => setView('userDashboard')}
          >
            View Order History
            <ArrowRight size={20} />
          </button>
          {orderData?.items && orderData.items.length > 0 && (
            <button 
              style={styles.downloadBtn}
              onClick={downloadInvoice}
            >
              <Download size={20} />
              Download Invoice
            </button>
          )}
        </div>
      </div>

      {/* Order Details & Bill Section */}
      {orderData?.items && orderData.items.length > 0 && (
        <div style={styles.detailsCard} ref={billRef}>
          <div style={styles.detailsHeader}>
            <div>
              <h2 style={styles.detailsTitle}>Order Summary</h2>
              <p style={styles.detailsSubtitle}>Review your order details and download invoice</p>
            </div>
            <button 
              style={styles.downloadButton} 
              onClick={downloadInvoice}
            >
              <Download size={18} />
              Download Invoice
            </button>
          </div>

          {/* Shipping Address */}
          {orderData.shippingAddress && (
            <div style={styles.addressSection}>
              <div style={styles.addressHeader}>
                <MapPin size={20} color="#2E7D32" />
                <span style={styles.addressTitle}>Delivery Address</span>
              </div>
              <p style={styles.addressText}>{orderData.shippingAddress}</p>
            </div>
          )}

          {/* Order Items */}
          <div style={styles.itemsSection}>
            <h3 style={styles.itemsTitle}>Order Items ({orderData.items.length})</h3>
            <div style={styles.billTable}>
              <div style={styles.billHeader}>
                <span style={styles.billHeaderItem}>Product</span>
                <span style={styles.billHeaderItem}>Price</span>
                <span style={styles.billHeaderItem}>Qty</span>
                <span style={styles.billHeaderItem}>Total</span>
              </div>
              {orderData.items.map((item, index) => (
                <div key={index} style={styles.billRow}>
                  <div style={styles.billProduct}>
                    {item.image_url && (
                      <img src={item.image_url} alt={item.product_name} style={styles.billItemImage} />
                    )}
                    <div style={styles.billProductInfo}>
                      <span style={styles.billProductName}>{item.product_name}</span>
                      {item.farmer_name && (
                        <span style={styles.billFarmerName}>Sold by: {item.farmer_name}</span>
                      )}
                    </div>
                  </div>
                  <span style={styles.billPrice}>₹{item.price}</span>
                  <span style={styles.billQuantity}>{item.quantity}</span>
                  <span style={styles.billTotal}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div style={styles.priceSummary}>
            <div style={styles.priceRow}>
              <span>Items Total</span>
              <span>₹{getDisplayTotalAmount()}</span>
            </div>
            <div style={styles.priceRow}>
              <span>Shipping</span>
              <span style={{color: '#2E7D32', fontWeight: '600'}}>FREE</span>
            </div>
            <div style={styles.priceRow}>
              <span>Tax</span>
              <span>₹0.00</span>
            </div>
            <div style={styles.totalRow}>
              <span>Total Amount</span>
              <span style={{fontSize: '1.4rem', fontWeight: '700', color: '#2E7D32'}}>₹{getDisplayTotalAmount()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Support Section */}
      <div style={styles.supportSection}>
        <div style={styles.supportContent}>
          <div style={styles.supportText}>
            <h3 style={styles.supportTitle}>Need Help With Your Order?</h3>
            <p style={styles.supportDescription}>
              Our customer support team is here to help you with any questions about your order.
            </p>
          </div>
          <div style={styles.supportContacts}>
            <div style={styles.contactItem}>
              <Phone size={20} color="#2E7D32" />
              <span>+91-9876543210</span>
            </div>
            <div style={styles.contactItem}>
              <Mail size={20} color="#2E7D32" />
              <span>support@freshfarm.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Suggestions Section */}
      <div style={styles.suggestionsSection}>
        <div style={styles.suggestionsHeader}>
          <div style={styles.suggestionsTitleContainer}>
            <Zap size={32} color="#FF6B35" style={styles.titleIcon} />
            <h2 style={styles.suggestionsTitle}>You Might Also Like</h2>
          </div>
          <p style={styles.suggestionsSubtitle}>
            Discover more fresh products from our local farmers
          </p>
        </div>
        
        {loadingSuggestions ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Finding fresh recommendations...</p>
          </div>
        ) : (
          <>
            <div style={styles.suggestionsGrid}>
              {suggestions.map((product, index) => (
                <div 
                  key={product.product_id} 
                  style={{
                    ...styles.productCard,
                    animationDelay: `${index * 0.1}s`
                  }}
                  onClick={() => addToCart(product)}
                >
                  {/* Product Image with Overlay */}
                  <div style={styles.productImageContainer}>
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.product_name}
                        style={styles.productImage}
                      />
                    )}
                    <div style={styles.imageOverlay}>
                      <button 
                        style={styles.quickAddButton}
                        onClick={(e) => quickAddToCart(product, e)}
                        title="Quick Add to Cart"
                      >
                        <ShoppingBag size={16} />
                      </button>
                      <button 
                        style={styles.wishlistButton}
                        onClick={(e) => e.stopPropagation()}
                        title="Add to Wishlist"
                      >
                        <Heart size={16} />
                      </button>
                    </div>
                    {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                      <div style={styles.lowStockBadge}>
                        Only {product.stock_quantity} left
                      </div>
                    )}
                    {product.stock_quantity === 0 && (
                      <div style={styles.outOfStockBadge}>
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div style={styles.productContent}>
                    <div style={styles.productHeader}>
                      <h3 style={styles.productName}>{product.product_name}</h3>
                      <div style={styles.categoryTag}>
                        {product.category}
                      </div>
                    </div>
                    
                    <p style={styles.productDescription}>
                      {product.description?.length > 80 
                        ? product.description.substring(0, 80) + '...' 
                        : product.description}
                    </p>

                    {/* Farmer Info */}
                    {product.first_name && (
                      <div style={styles.farmerInfo}>
                        <div style={styles.farmerAvatar}>
                          {product.first_name[0]}{product.last_name?.[0] || ''}
                        </div>
                        <div style={styles.farmerDetails}>
                          <span style={styles.farmerName}>
                            {product.first_name} {product.last_name}
                          </span>
                          <div style={styles.rating}>
                            <Star size={12} color="#FFD700" fill="#FFD700" />
                            <span style={styles.ratingText}>4.8</span>
                            <span style={styles.ratingCount}>(24)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price and Action */}
                    <div style={styles.productFooter}>
                      <div style={styles.priceContainer}>
                        <span style={styles.productPrice}>₹{product.price}</span>
                        {product.originalPrice && (
                          <span style={styles.originalPrice}>₹{product.originalPrice}</span>
                        )}
                      </div>
                      <button 
                        style={
                          product.stock_quantity === 0 
                            ? styles.addButtonDisabled 
                            : styles.addButton
                        }
                        onClick={(e) => quickAddToCart(product, e)}
                        disabled={product.stock_quantity === 0}
                      >
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Button */}
            <div style={styles.viewMoreContainer}>
              <button 
                style={styles.viewMoreButton}
                onClick={() => setView('products')}
              >
                <ShoppingBag size={18} />
                View All Products
                <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ... (styles object remains exactly the same as in the previous OrderSuccess component)
// ... (CSS animations remain the same)

const styles = {
  container: {
    padding: '0',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    overflow: 'hidden',
  },
  confetti: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    width: '12px',
    height: '24px',
    opacity: 0,
    top: '-20px',
    transform: 'translateY(0)',
    animation: 'confettiFall 3s linear forwards',
  },
  successCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)',
    borderRadius: '0 0 30px 30px',
    padding: '4rem 2rem 3rem',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    animation: 'slideUp 0.7s ease-out forwards',
  },
  iconWrapper: {
    width: '120px',
    height: '120px',
    margin: '0 auto 2rem',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'scaleIn 0.5s 0.2s ease-out forwards',
    transform: 'scale(0)',
    boxShadow: '0 10px 30px rgba(46, 125, 50, 0.2)',
  },
  title: {
    fontSize: '3rem',
    color: '#1B5E20',
    margin: '0 0 1rem 0',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#555',
    maxWidth: '600px',
    margin: '0 auto 3rem',
    lineHeight: 1.6,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
    maxWidth: '900px',
    margin: '0 auto 3rem',
  },
  summaryCard: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
    border: '1px solid #e8f5e9',
    transition: 'transform 0.3s ease',
  },
  summaryIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    flex: 1,
  },
  summaryLabel: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1B5E20',
  },
  trustIndicators: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '3rem',
    flexWrap: 'wrap',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#fff',
    padding: '0.8rem 1.5rem',
    borderRadius: '50px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    fontWeight: '500',
    color: '#555',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 8px 20px rgba(46, 125, 50, 0.3)',
    transition: 'all 0.3s ease',
  },
  secondaryButton: {
    background: 'transparent',
    color: '#2E7D32',
    border: '2px solid #2E7D32',
    borderRadius: '50px',
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s ease',
  },
  downloadBtn: {
    background: '#fff',
    color: '#2E7D32',
    border: '2px solid #e8f5e9',
    borderRadius: '50px',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },
  detailsCard: {
    background: '#fff',
    borderRadius: '24px',
    padding: '3rem',
    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.08)',
    margin: '2rem auto',
    animation: 'slideUp 0.7s 0.2s ease-out forwards',
    opacity: 0,
    maxWidth: '1000px',
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #eee',
    paddingBottom: '2rem',
    marginBottom: '2rem',
  },
  detailsTitle: {
    color: '#1B5E20',
    fontSize: '2rem',
    margin: '0 0 0.5rem 0',
    fontWeight: '700',
  },
  detailsSubtitle: {
    color: '#666',
    fontSize: '1.1rem',
    margin: 0,
  },
  downloadButton: {
    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
  },
  addressSection: {
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e8f5e9 100%)',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
  },
  addressHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  addressTitle: {
    fontWeight: '600',
    color: '#1B5E20',
    fontSize: '1.1rem',
  },
  addressText: {
    margin: 0,
    color: '#555',
    lineHeight: 1.6,
    fontSize: '1.1rem',
  },
  itemsSection: {
    marginBottom: '2rem',
  },
  itemsTitle: {
    fontSize: '1.4rem',
    color: '#333',
    marginBottom: '1.5rem',
    fontWeight: '600',
  },
  billTable: {
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #e8f5e9',
    background: '#fff',
  },
  billHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    padding: '1.5rem',
    fontWeight: '600',
    color: 'white',
  },
  billHeaderItem: {
    textAlign: 'left'
  },
  billRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: '1.5rem',
    alignItems: 'center',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.2s ease',
  },
  billProduct: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  billItemImage: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  billProductInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  billProductName: {
    fontWeight: '600',
    color: '#333',
    fontSize: '1.1rem',
  },
  billFarmerName: {
    fontSize: '0.9rem',
    color: '#777',
    marginTop: '0.25rem',
  },
  billPrice: { 
    color: '#555',
    fontWeight: '500',
  },
  billQuantity: { 
    color: '#555',
    fontWeight: '500',
  },
  billTotal: { 
    fontWeight: '700', 
    color: '#2E7D32',
    fontSize: '1.1rem',
  },
  priceSummary: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '2px solid #e8f5e9',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    color: '#555',
    fontSize: '1.1rem',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '2px dashed #e8f5e9',
    fontWeight: '600',
    color: '#333',
    fontSize: '1.2rem',
  },
  supportSection: {
    background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
    color: 'white',
    padding: '3rem 2rem',
    margin: '2rem 0',
  },
  supportContent: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '2rem',
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: '2rem',
    margin: '0 0 1rem 0',
    fontWeight: '700',
  },
  supportDescription: {
    fontSize: '1.1rem',
    opacity: 0.9,
    margin: 0,
  },
  supportContacts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.1rem',
  },
  suggestionsSection: {
    background: 'linear-gradient(180deg, #F1F8E9 0%, #FFFFFF 100%)',
    borderRadius: '30px 30px 0 0',
    padding: '4rem 2rem',
    marginTop: '2rem',
    animation: 'slideUp 0.7s 0.4s ease-out forwards',
    opacity: 0,
  },
  suggestionsHeader: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  suggestionsTitleContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  titleIcon: {
    animation: 'scaleIn 0.5s 0.6s ease-out forwards',
  },
  suggestionsTitle: {
    fontSize: '2.5rem',
    color: '#1B5E20',
    margin: 0,
    fontWeight: '700',
  },
  suggestionsSubtitle: {
    fontSize: '1.2rem',
    color: '#555',
    marginTop: '0.5rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 0',
  },
  loadingSpinner: {
    width: '60px',
    height: '60px',
    border: '6px solid #E8F5E9',
    borderBottomColor: '#2E7D32',
    borderRadius: '50%',
    display: 'inline-block',
    boxSizing: 'border-box',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1.5rem',
    color: '#2E7D32',
    fontWeight: '500',
    fontSize: '1.1rem',
  },
  suggestionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '2.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  productCard: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    opacity: 0,
    animation: 'slideUp 0.5s ease-out forwards',
  },
  productImageContainer: {
    position: 'relative',
    overflow: 'hidden',
    height: '220px',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  quickAddButton: {
    background: '#2E7D32',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  wishlistButton: {
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  lowStockBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8A65 100%)',
    color: 'white',
    padding: '0.4rem 0.8rem',
    borderRadius: '50px',
    fontSize: '0.8rem',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'linear-gradient(135deg, #757575 0%, #9E9E9E 100%)',
    color: 'white',
    padding: '0.4rem 0.8rem',
    borderRadius: '50px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  productContent: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  },
  productName: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#333',
    margin: 0,
    lineHeight: 1.3,
  },
  categoryTag: {
    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    color: '#2E7D32',
    padding: '0.4rem 0.8rem',
    borderRadius: '50px',
    fontSize: '0.8rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  productDescription: {
    fontSize: '0.95rem',
    color: '#666',
    lineHeight: 1.5,
    flexGrow: 1,
    marginBottom: '1.5rem',
  },
  farmerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  farmerAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '1rem',
  },
  farmerDetails: {},
  farmerName: {
    fontWeight: '600',
    color: '#444',
    fontSize: '1rem',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginTop: '0.25rem',
  },
  ratingText: {
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: '0.85rem',
    color: '#777',
  },
  productFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '1.5rem',
    borderTop: '1px solid #f0f0f0',
  },
  priceContainer: {},
  productPrice: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#2E7D32',
  },
  originalPrice: {
    fontSize: '1rem',
    color: '#999',
    textDecoration: 'line-through',
    marginLeft: '0.5rem',
  },
  addButton: {
    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '0.8rem 1.5rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
  },
  addButtonDisabled: {
    background: '#BDBDBD',
    color: '#757575',
    border: 'none',
    borderRadius: '12px',
    padding: '0.8rem 1.5rem',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  viewMoreContainer: {
    textAlign: 'center',
    marginTop: '4rem',
  },
  viewMoreButton: {
    background: 'transparent',
    color: '#2E7D32',
    border: '2px solid #2E7D32',
    borderRadius: '50px',
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s ease',
  },
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes confettiFall {
    to {
      opacity: 1;
      transform: translateY(100vh) rotate(360deg);
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .summaryCard:hover {
    transform: translateY(-5px);
  }

  .primaryButton:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 25px rgba(46, 125, 50, 0.4);
  }

  .secondaryButton:hover {
    background: #2E7D32;
    color: white;
    transform: translateY(-3px);
  }

  .downloadBtn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  }

  .downloadButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(46, 125, 50, 0.4);
  }

  .billRow:hover {
    background: #f8f9fa;
  }

  .productCard:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  }

  .productCard:hover .imageOverlay {
    opacity: 1;
  }

  .productCard:hover .productImage {
    transform: scale(1.05);
  }

  .quickAddButton:hover {
    background: #1B5E20 !important;
    transform: scale(1.1);
  }

  .wishlistButton:hover {
    background: #ff4757 !important;
    color: white !important;
    transform: scale(1.1);
  }

  .addButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(46, 125, 50, 0.4);
  }

  .viewMoreButton:hover {
    background: #2E7D32;
    color: white;
    transform: translateY(-3px);
  }
`;
document.head.appendChild(styleSheet);

export default OrderSuccess;