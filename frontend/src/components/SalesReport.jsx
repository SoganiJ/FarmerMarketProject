import React, { useState, useEffect } from 'react';

function SalesReport({ auth }) {
  const [salesData, setSalesData] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'total_revenue', direction: 'desc' });
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/farmer/sales-report?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedData = [...salesData].sort((a, b) => {
    const aVal = parseFloat(a[sortConfig.key]) || 0;
    const bVal = parseFloat(b[sortConfig.key]) || 0;
    return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const totalRevenue = salesData.reduce((sum, item) => sum + (parseFloat(item.total_revenue) || 0), 0);
  const totalUnits = salesData.reduce((sum, item) => sum + (parseInt(item.units_sold) || 0), 0);
  const avgRevenuePerProduct = salesData.length > 0 ? totalRevenue / salesData.length : 0;

  const styles = {
    container: {
      padding: '2rem',
      background: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    selectGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.8rem',
      color: '#8b9aa7',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    select: {
      padding: '0.75rem 1.5rem',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      background: '#ffffff',
      fontSize: '0.9rem',
      fontWeight: '500',
      color: '#2c3e33',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.2s ease'
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
      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
    }),
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    summaryCard: {
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #e8eaed',
      textAlign: 'center',
      transition: 'all 0.3s ease'
    },
    summaryLabel: {
      fontSize: '0.8rem',
      color: '#8b9aa7',
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: '0.5rem',
      letterSpacing: '0.5px'
    },
    summaryValue: (color = '#2e7d32') => ({
      fontSize: '1.8rem',
      fontWeight: '700',
      color: color,
      margin: '0.25rem 0'
    }),
    tableWrapper: {
      overflowX: 'auto',
      borderRadius: '12px',
      border: '1px solid #e8eaed'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: '#ffffff'
    },
    thead: {
      background: '#f8f9fa',
      borderBottom: '2px solid #e8eaed'
    },
    th: {
      padding: '1rem 1.5rem',
      textAlign: 'left',
      fontSize: '0.85rem',
      fontWeight: '700',
      color: '#2c3e33',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.2s ease',
      position: 'relative'
    },
    td: {
      padding: '1.25rem 1.5rem',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '0.95rem',
      color: '#2c3e33'
    },
    productName: {
      fontWeight: '600',
      color: '#2c3e33'
    },
    revenue: {
      fontWeight: '700',
      color: '#2e7d32',
      fontSize: '1.05rem'
    },
    units: {
      color: '#1976d2',
      fontWeight: '600'
    },
    sortIcon: {
      marginLeft: '0.5rem',
      fontSize: '0.7rem',
      color: '#8b9aa7'
    },
    cardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem'
    },
    productCard: {
      background: '#ffffff',
      border: '1px solid #e8eaed',
      borderRadius: '12px',
      padding: '1.5rem',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    cardTitle: {
      fontSize: '1.1rem',
      fontWeight: '700',
      color: '#2c3e33',
      marginBottom: '1rem'
    },
    cardStats: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '1rem'
    },
    cardStat: {
      flex: '1',
      padding: '0.75rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      textAlign: 'center'
    },
    cardStatLabel: {
      fontSize: '0.75rem',
      color: '#8b9aa7',
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: '0.25rem'
    },
    cardStatValue: (color) => ({
      fontSize: '1.2rem',
      fontWeight: '700',
      color: color
    }),
    emptyState: {
      textAlign: 'center',
      padding: '4rem 2rem',
      color: '#8b9aa7',
      background: '#f8f9fa',
      borderRadius: '12px',
      border: '2px dashed #e2e8f0'
    },
    emptyTitle: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: '#2c3e33',
      marginBottom: '0.5rem'
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
    rank: {
      
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
      color: '#ffffff',
      fontSize: '0.85rem',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '0.75rem'
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .summary-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }
          .product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }
          tbody tr:hover {
            background: #f8f9fa;
          }
          th:hover {
            background: #e8f5e9;
            color: #2e7d32;
          }
          select:focus {
            border-color: #2e7d32 !important;
          }
        `}
      </style>

      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Sales Report</h3>
        <div style={styles.controls}>
          <div style={styles.selectGroup}>
            <label style={styles.label}>Time Range</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={styles.select}
              onMouseEnter={(e) => e.target.style.borderColor = '#2e7d32'}
              onMouseLeave={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <div style={styles.selectGroup}>
            <label style={styles.label}>View Mode</label>
            <div style={styles.viewToggle}>
              <button 
                style={styles.viewBtn(viewMode === 'table')}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
              <button 
                style={styles.viewBtn(viewMode === 'cards')}
                onClick={() => setViewMode('cards')}
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading sales data...</p>
        </div>
      ) : salesData.length === 0 ? (
        <div style={styles.emptyState}>
          <h3 style={styles.emptyTitle}>No Sales Data</h3>
          <p>No sales data available for the selected time range.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard} className="summary-card">
              <div style={styles.summaryLabel}>Total Revenue</div>
              <div style={styles.summaryValue()}>₹{totalRevenue.toLocaleString()}</div>
            </div>
            <div style={styles.summaryCard} className="summary-card">
              <div style={styles.summaryLabel}>Total Units Sold</div>
              <div style={styles.summaryValue('#1976d2')}>{totalUnits.toLocaleString()}</div>
            </div>
            <div style={styles.summaryCard} className="summary-card">
              <div style={styles.summaryLabel}>Products Sold</div>
              <div style={styles.summaryValue('#f57c00')}>{salesData.length}</div>
            </div>
            <div style={styles.summaryCard} className="summary-card">
              <div style={styles.summaryLabel}>Avg Revenue/Product</div>
              <div style={styles.summaryValue('#9c27b0')}>₹{avgRevenuePerProduct.toFixed(2)}</div>
            </div>
          </div>

          {/* Table or Card View */}
          {viewMode === 'table' ? (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Rank</th>
                    <th 
                      style={styles.th}
                      onClick={() => handleSort('product_name')}
                    >
                      Product
                      <span style={styles.sortIcon}>
                        {sortConfig.key === 'product_name' && (sortConfig.direction === 'desc' ? '▼' : '▲')}
                      </span>
                    </th>
                    <th 
                      style={styles.th}
                      onClick={() => handleSort('units_sold')}
                    >
                      Units Sold
                      <span style={styles.sortIcon}>
                        {sortConfig.key === 'units_sold' && (sortConfig.direction === 'desc' ? '▼' : '▲')}
                      </span>
                    </th>
                    <th 
                      style={styles.th}
                      onClick={() => handleSort('total_revenue')}
                    >
                      Total Revenue
                      <span style={styles.sortIcon}>
                        {sortConfig.key === 'total_revenue' && (sortConfig.direction === 'desc' ? '▼' : '▲')}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((item, index) => (
                    <tr key={item.product_id}>
                      <td style={styles.td}>
                        <div style={styles.rank}>
                          {index + 1}
                        </div>
                      </td>
                      <td style={{...styles.td, ...styles.productName}}>
                        {item.product_name}
                      </td>
                      <td style={{...styles.td, ...styles.units}}>
                        {parseInt(item.units_sold || 0).toLocaleString()}
                      </td>
                      <td style={{...styles.td, ...styles.revenue}}>
                        ₹{parseFloat(item.total_revenue || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {sortedData.map((item, index) => (
                <div key={item.product_id} style={styles.productCard} className="product-card">
                  <div style={styles.cardTitle}>
                    <div style={styles.rank}>{index + 1}</div>
                    {item.product_name}
                  </div>
                  <div style={styles.cardStats}>
                    <div style={styles.cardStat}>
                      <div style={styles.cardStatLabel}>Units Sold</div>
                      <div style={styles.cardStatValue('#1976d2')}>
                        {parseInt(item.units_sold || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={styles.cardStat}>
                      <div style={styles.cardStatLabel}>Revenue</div>
                      <div style={styles.cardStatValue('#2e7d32')}>
                        ₹{parseFloat(item.total_revenue || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SalesReport;