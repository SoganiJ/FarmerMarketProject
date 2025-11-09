import React, { useState, useEffect } from 'react';

function Analytics({ auth }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [viewMode, setViewMode] = useState('cards');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
  try {
    setLoading(true);
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/farmer/analytics?period=${period}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` }
      }
    );

      if (response.ok) {
        const data = await response.json();
        const processedData = {
          ...data,
          customerStats: {
            ...data.customerStats,
            avg_order_value: parseFloat(data.customerStats?.avg_order_value) || 0
          },
          summary: {
            ...data.summary,
            totalRevenue: parseFloat(data.summary?.totalRevenue) || 0,
            totalItemsSold: parseInt(data.summary?.totalItemsSold) || 0
          },
          salesData: data.salesData?.map(item => ({
            ...item,
            total_revenue: parseFloat(item.total_revenue) || 0,
            total_sold: parseInt(item.total_sold) || 0,
            avg_price: parseFloat(item.avg_price) || 0
          })) || [],
          trends: data.trends?.map(trend => ({
            ...trend,
            monthly_revenue: parseFloat(trend.monthly_revenue) || 0,
            monthly_quantity: parseInt(trend.monthly_quantity) || 0
          })) || []
        };
        setAnalytics(processedData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      padding: '1.5rem',
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e8eaed'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: '#2c3e33',
      margin: 0,
      letterSpacing: '-0.5px'
    },
    controls: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center'
    },
    periodSelect: {
      padding: '0.7rem 1.2rem',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '0.9rem',
      color: '#2d3748',
      background: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none',
      fontWeight: '500'
    },
    viewToggle: {
      display: 'flex',
      gap: '0.5rem',
      background: '#f8f9fa',
      padding: '0.25rem',
      borderRadius: '8px'
    },
    viewBtn: (isActive) => ({
      padding: '0.5rem 1rem',
      border: 'none',
      background: isActive ? '#ffffff' : 'transparent',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '500',
      color: isActive ? '#2e7d32' : '#5a6c7d',
      transition: 'all 0.2s ease',
      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
    }),
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2.5rem'
    },
    summaryCard: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      padding: '1.8rem',
      borderRadius: '12px',
      border: '1px solid #e8eaed',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    summaryLabel: {
      fontSize: '0.8rem',
      color: '#8b9aa7',
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: '0.75rem',
      letterSpacing: '0.5px'
    },
    summaryValue: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#2e7d32',
      margin: 0,
      lineHeight: '1.2'
    },
    summaryIcon: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      fontSize: '2rem',
      opacity: '0.1'
    },
    section: {
      marginTop: '2.5rem'
    },
    sectionHeader: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: '#2c3e33',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    sectionIcon: {
      width: '8px',
      height: '8px',
      background: '#2e7d32',
      borderRadius: '50%'
    },
    productsList: {
      display: 'grid',
      gap: '1rem'
    },
    productCard: {
      background: '#ffffff',
      border: '1px solid #e8eaed',
      borderRadius: '10px',
      padding: '1.5rem',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
    },
    productHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem',
      gap: '1rem'
    },
    productInfo: {
      flex: '1'
    },
    productName: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#2c3e33',
      margin: '0 0 0.5rem 0'
    },
    productCategory: {
      fontSize: '0.8rem',
      color: '#8b9aa7',
      textTransform: 'uppercase',
      fontWeight: '500',
      padding: '0.25rem 0.75rem',
      background: '#f8f9fa',
      borderRadius: '6px',
      display: 'inline-block'
    },
    performanceStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '1rem',
      marginTop: '1rem'
    },
    statItem: {
      padding: '0.75rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      textAlign: 'center'
    },
    statLabel: {
      fontSize: '0.75rem',
      color: '#8b9aa7',
      marginBottom: '0.25rem',
      textTransform: 'uppercase',
      fontWeight: '600'
    },
    statValue: {
      fontSize: '1.1rem',
      fontWeight: '700',
      color: '#2e7d32'
    },
    trendsList: {
      display: 'grid',
      gap: '1rem'
    },
    trendItem: {
      background: '#ffffff',
      border: '1px solid #e8eaed',
      borderRadius: '10px',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s ease',
      gap: '1rem',
      flexWrap: 'wrap'
    },
    trendMonth: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#2c3e33',
      minWidth: '120px'
    },
    trendRevenue: {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: '#2e7d32',
      flex: '1',
      textAlign: 'right'
    },
    trendQuantity: {
      fontSize: '0.9rem',
      color: '#5a6c7d',
      padding: '0.5rem 1rem',
      background: '#f8f9fa',
      borderRadius: '6px',
      fontWeight: '500'
    },
    noData: {
      textAlign: 'center',
      padding: '3rem 2rem',
      color: '#8b9aa7',
      background: '#f8f9fa',
      borderRadius: '10px',
      border: '2px dashed #e2e8f0',
      fontSize: '0.95rem'
    },
    loading: {
      textAlign: 'center',
      padding: '4rem 2rem',
      color: '#8b9aa7'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #f0f0f0',
      borderTop: '4px solid #2e7d32',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 1rem'
    },
    error: {
      textAlign: 'center',
      padding: '3rem 2rem',
      color: '#d32f2f',
      background: '#ffebee',
      borderRadius: '10px',
      border: '1px solid #ef5350',
      fontWeight: '500'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: '#e8eaed',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '0.5rem'
    },
    progressFill: (percentage) => ({
      height: '100%',
      background: 'linear-gradient(90deg, #2e7d32, #66bb6a)',
      width: `${percentage}%`,
      transition: 'width 0.5s ease',
      borderRadius: '4px'
    })
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          Unable to load analytics. Please try again later.
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...analytics.salesData.map(p => p.total_revenue), 1);

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .summary-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          }
          .product-card:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          .trend-item:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          select:focus {
            border-color: #2e7d32 !important;
          }
        `}
      </style>

      <div style={styles.header}>
        <h3 style={styles.title}>Sales Analytics</h3>
        <div style={styles.controls}>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            style={styles.periodSelect}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard} className="summary-card">
          <div style={styles.summaryIcon}>💰</div>
          <div style={styles.summaryLabel}>Total Revenue</div>
          <div style={styles.summaryValue}>
            ₹{analytics.summary.totalRevenue.toLocaleString()}
          </div>
        </div>
        
        <div style={styles.summaryCard} className="summary-card">
          <div style={styles.summaryIcon}>📦</div>
          <div style={styles.summaryLabel}>Items Sold</div>
          <div style={styles.summaryValue}>
            {analytics.summary.totalItemsSold.toLocaleString()}
          </div>
        </div>
        
        <div style={styles.summaryCard} className="summary-card">
          <div style={styles.summaryIcon}>👥</div>
          <div style={styles.summaryLabel}>Total Customers</div>
          <div style={styles.summaryValue}>
            {analytics.customerStats.total_customers || 0}
          </div>
        </div>
        
        <div style={styles.summaryCard} className="summary-card">
          <div style={styles.summaryIcon}>💳</div>
          <div style={styles.summaryLabel}>Avg Order Value</div>
          <div style={styles.summaryValue}>
            ₹{analytics.customerStats.avg_order_value.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionIcon}></div>
          <span>Product Performance</span>
        </div>
        {analytics.salesData.length === 0 ? (
          <div style={styles.noData}>
            No sales data available for this period
          </div>
        ) : (
          <div style={styles.productsList}>
            {analytics.salesData.map(product => (
              <div key={product.product_id} style={styles.productCard} className="product-card">
                <div style={styles.productHeader}>
                  <div style={styles.productInfo}>
                    <h4 style={styles.productName}>{product.product_name}</h4>
                    <span style={styles.productCategory}>{product.category}</span>
                  </div>
                </div>
                
                <div style={styles.performanceStats}>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Sold</div>
                    <div style={styles.statValue}>{product.total_sold}</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Revenue</div>
                    <div style={styles.statValue}>
                      ₹{product.total_revenue.toLocaleString()}
                    </div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Orders</div>
                    <div style={styles.statValue}>{product.order_count}</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Avg Price</div>
                    <div style={styles.statValue}>
                      ₹{product.avg_price.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div style={styles.progressBar}>
                  <div style={styles.progressFill((product.total_revenue / maxRevenue) * 100)}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales Trends */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionIcon}></div>
          <span>Sales Trends</span>
        </div>
        {analytics.trends.length === 0 ? (
          <div style={styles.noData}>
            No trend data available for this period
          </div>
        ) : (
          <div style={styles.trendsList}>
            {analytics.trends.map((trend, index) => (
              <div key={index} style={styles.trendItem} className="trend-item">
                <span style={styles.trendMonth}>{trend.month}</span>
                <span style={styles.trendRevenue}>
                  ₹{trend.monthly_revenue.toLocaleString()}
                </span>
                <span style={styles.trendQuantity}>
                  {trend.monthly_quantity} items
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;