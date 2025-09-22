import React, { useState, useEffect } from "react";

// Utility: debounce hook
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function ProductList({ auth, categories, addToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    search: ""
  });

  const debouncedSearch = useDebounce(filters.search);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [filters.category, debouncedSearch]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.category !== "all") params.append("category", filters.category);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`http://localhost:3001/api/products?${params}`);

      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  // --- STYLES ---
  const styles = {
    container: { width: "100%", padding: "2rem", maxWidth: "1400px", margin: "0 auto" },
    header: { textAlign: "center", marginBottom: "2rem", color: "#2E7D32" },
    filters: {
      display: "flex",
      gap: "1rem",
      marginBottom: "2rem",
      flexWrap: "wrap",
      background: "white",
      padding: "1.5rem",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    filterGroup: { display: "flex", flexDirection: "column", gap: "0.5rem" },
    filterLabel: { fontWeight: "500", fontSize: "0.9rem", color: "#333" },
    filterSelect: {
      padding: "0.5rem",
      border: "1px solid #ddd",
      borderRadius: "5px",
      minWidth: "150px"
    },
    searchInput: {
      padding: "0.5rem",
      border: "1px solid #ddd",
      borderRadius: "5px",
      minWidth: "200px"
    },
    productGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "2rem"
    },
    card: {
      background: "white",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      overflow: "hidden",
      transition: "transform 0.2s ease, box-shadow 0.2s ease"
    },
    image: { width: "100%", height: "200px", objectFit: "cover" },
    info: { padding: "1.2rem" },
    name: { margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#333" },
    description: { fontSize: "0.9rem", color: "#666", marginBottom: "0.8rem", lineHeight: 1.4 },
    farmer: { fontSize: "0.8rem", color: "#666", marginBottom: "0.8rem" },
    meta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" },
    price: { color: "#2E7D32", fontWeight: "bold", fontSize: "1.2rem" },
    stock: { fontSize: "0.9rem" },
    addButton: {
      width: "100%",
      padding: "0.75rem",
      background: "#2E7D32",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "600",
      transition: "background 0.2s ease"
    },
    skeleton: {
      background: "#eee",
      height: "200px",
      borderRadius: "10px"
    },
    empty: {
      textAlign: "center",
      padding: "3rem",
      color: "#666",
      background: "white",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    error: { textAlign: "center", color: "#d32f2f", fontWeight: "bold", marginBottom: "1rem" }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Farm Fresh Products</h2>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Category</label>
          <select
            style={styles.filterSelect}
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Search</label>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Product Grid */}
      {loading ? (
        <div style={styles.productGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.skeleton}></div>
              <div style={styles.info}>
                <div style={{ ...styles.skeleton, height: "20px", marginBottom: "0.5rem" }}></div>
                <div style={{ ...styles.skeleton, height: "15px", width: "60%" }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={styles.empty}>
          <h3>No products found</h3>
          <p>Try adjusting your search filters.</p>
        </div>
      ) : (
        <div style={styles.productGrid}>
          {products.map((product) => (
            <div key={product.product_id} style={styles.card}>
              {product.image_url && (
                <img
                  src={`http://localhost:3001/uploads/${product.image_url}`}
                  alt={product.product_name}
                  style={styles.image}
                />
              )}
              <div style={styles.info}>
                <h3 style={styles.name}>{product.product_name}</h3>
                <p style={styles.description}>
                  {product.description.length > 100
                    ? `${product.description.substring(0, 100)}...`
                    : product.description}
                </p>

                <div style={styles.farmer}>
                  Sold by: {product.first_name} {product.last_name}
                </div>

                <div style={styles.meta}>
                  <div style={styles.price}>₹{product.price}</div>
                  <div
                    style={{
                      ...styles.stock,
                      color:
                        product.stock_quantity > 10
                          ? "#2E7D32"
                          : product.stock_quantity > 0
                          ? "#ff9800"
                          : "#f44336"
                    }}
                  >
                    {product.stock_quantity > 0
                      ? `${product.stock_quantity} in stock`
                      : "Out of stock"}
                  </div>
                </div>

                <button
                  style={{
                    ...styles.addButton,
                    background: product.stock_quantity === 0 ? "#ccc" : "#2E7D32"
                  }}
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity === 0}
                >
                  {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
