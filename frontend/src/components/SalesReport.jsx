import React, { useState, useEffect } from 'react';

function SalesReport({ auth }) {
  const [salesData, setSalesData] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(false);

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

  return (
    <div>
      <h3>Sales Report</h3>
      <div>
        <label>Time Range: </label>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
      
      {loading ? (
        <p>Loading sales data...</p>
      ) : (
        <div>
          {salesData.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.product_name}</td>
                    <td>{item.units_sold}</td>
                    <td>₹{item.total_revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No sales data available for the selected time range.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SalesReport;