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
    search: "",
    sortBy: "newest"
  });
  const [hoveredCard, setHoveredCard] = useState(null);

  const debouncedSearch = useDebounce(filters.search);

  useEffect(() => {
    fetchProducts();
  }, [filters.category, debouncedSearch, filters.sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.category !== "all") params.append("category", filters.category);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filters.sortBy) params.append("sort", filters.sortBy);

      console.log('Fetching products with params:', params.toString()); // Debug

      const response = await fetch(`http://localhost:3001/api/products?${params}`);

      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      
      console.log('Received products:', data); // Debug
      setProducts(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    console.log('Filter changed:', filterType, value); // Debug
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const handleAddToCart = (product) => {
    console.log('Add to cart clicked:', product); // Debug
    if (product.stock_quantity > 0) {
      if (addToCart) {
        addToCart(product);
        alert(`${product.product_name} added to cart!`);
      } else {
        console.error('addToCart function not provided');
        alert('Add to cart functionality not available');
      }
    } else {
      alert('This product is out of stock');
    }
  };

  // Refresh products function
  const refreshProducts = () => {
    fetchProducts();
  };

  // Quick category filter buttons
  const popularCategories = categories && categories.length > 0 ? categories.slice(0, 5) : [];

  // --- STYLES ---
  const styles = {
    container: {
      width: "100%",
      padding: "2.5rem 1.5rem",
      maxWidth: "1400px",
      margin: "0 auto",
      background: "linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)",
      minHeight: "100vh"
    },
    header: {
      textAlign: "center",
      marginBottom: "1.5rem",
      color: "#2c3e33",
      fontSize: "2.2rem",
      fontWeight: "700",
      letterSpacing: "-0.5px"
    },
    quickFilters: {
      display: "flex",
      justifyContent: "center",
      gap: "0.75rem",
      marginBottom: "1.5rem",
      flexWrap: "wrap"
    },
    quickFilterButton: (isActive) => ({
      padding: "0.5rem 1rem",
      border: `2px solid ${isActive ? "#2e7d32" : "#e2e8f0"}`,
      borderRadius: "20px",
      background: isActive ? "#2e7d32" : "#ffffff",
      color: isActive ? "#ffffff" : "#4a5568",
      fontSize: "0.85rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      outline: "none"
    }),
    refreshButton: {
      padding: "0.5rem 1rem",
      border: "2px solid #2e7d32",
      borderRadius: "8px",
      background: "transparent",
      color: "#2e7d32",
      fontSize: "0.85rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    filtersContainer: {
      background: "#ffffff",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      marginBottom: "2.5rem",
      border: "1px solid #e8eaed"
    },
    filtersHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem"
    },
    filtersTitle: {
      fontSize: "1.1rem",
      fontWeight: "600",
      color: "#2c3e33",
      margin: 0
    },
    filtersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1.5rem"
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem"
    },
    filterLabel: {
      fontWeight: "600",
      fontSize: "0.85rem",
      color: "#4a5568",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    filterSelect: {
      padding: "0.75rem 1rem",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "0.95rem",
      color: "#2d3748",
      background: "#ffffff",
      cursor: "pointer",
      transition: "all 0.2s ease",
      outline: "none"
    },
    searchInput: {
      padding: "0.75rem 1rem",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "0.95rem",
      color: "#2d3748",
      background: "#ffffff",
      transition: "all 0.2s ease",
      outline: "none"
    },
    productGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "2rem",
      marginTop: "2rem"
    },
    card: (isHovered) => ({
      background: "#ffffff",
      borderRadius: "12px",
      boxShadow: isHovered
        ? "0 12px 24px rgba(0,0,0,0.12)"
        : "0 2px 8px rgba(0,0,0,0.06)",
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      transform: isHovered ? "translateY(-8px)" : "translateY(0)",
      border: "1px solid #e8eaed",
      cursor: "pointer"
    }),
    imageContainer: {
      position: "relative",
      width: "100%",
      height: "220px",
      overflow: "hidden",
      background: "#f5f5f5"
    },
    image: (isHovered) => ({
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "transform 0.4s ease",
      transform: isHovered ? "scale(1.08)" : "scale(1)"
    }),
    stockBadge: (stock) => ({
      position: "absolute",
      top: "12px",
      right: "12px",
      padding: "0.4rem 0.8rem",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: "600",
      background:
        stock > 10 ? "#2e7d32" : stock > 0 ? "#f57c00" : "#d32f2f",
      color: "#ffffff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    }),
    info: {
      padding: "1.5rem"
    },
    name: {
      margin: "0 0 0.75rem 0",
      fontSize: "1.2rem",
      fontWeight: "700",
      color: "#2c3e33",
      lineHeight: "1.3",
      minHeight: "2.6rem"
    },
    description: {
      fontSize: "0.9rem",
      color: "#5a6c7d",
      marginBottom: "1rem",
      lineHeight: "1.5",
      minHeight: "3rem"
    },
    farmerSection: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem",
      background: "#f8f9fa",
      borderRadius: "8px",
      marginBottom: "1rem"
    },
    farmerIcon: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      background: "#e8f5e9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1rem",
      color: "#2e7d32",
      fontWeight: "600"
    },
    farmerInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "0.1rem"
    },
    farmerLabel: {
      fontSize: "0.7rem",
      color: "#8b9aa7",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.3px"
    },
    farmerName: {
      fontSize: "0.9rem",
      color: "#2c3e33",
      fontWeight: "600"
    },
    priceRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem"
    },
    price: {
      color: "#2e7d32",
      fontWeight: "700",
      fontSize: "1.5rem",
      letterSpacing: "-0.5px"
    },
    addButton: (disabled, isHovered) => ({
      width: "100%",
      padding: "0.9rem",
      background: disabled
        ? "#e0e0e0"
        : isHovered
        ? "#1b5e20"
        : "#2e7d32",
      color: disabled ? "#9e9e9e" : "#ffffff",
      border: "none",
      borderRadius: "8px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: "600",
      fontSize: "0.95rem",
      transition: "all 0.3s ease",
      transform: isHovered && !disabled ? "scale(1.02)" : "scale(1)",
      boxShadow: isHovered && !disabled
        ? "0 4px 12px rgba(46, 125, 50, 0.3)"
        : "none"
    }),
    skeleton: {
      background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      borderRadius: "8px"
    },
    skeletonCard: {
      background: "#ffffff",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid #e8eaed"
    },
    empty: {
      textAlign: "center",
      padding: "4rem 2rem",
      color: "#5a6c7d",
      background: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      border: "1px solid #e8eaed"
    },
    emptyTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#2c3e33",
      marginBottom: "0.5rem"
    },
    emptyText: {
      fontSize: "1rem",
      color: "#8b9aa7"
    },
    error: {
      textAlign: "center",
      color: "#d32f2f",
      fontWeight: "600",
      marginBottom: "1.5rem",
      padding: "1rem",
      background: "#ffebee",
      borderRadius: "8px",
      border: "1px solid #ef5350"
    },
    resultsCount: {
      textAlign: "center",
      fontSize: "0.9rem",
      color: "#5a6c7d",
      marginBottom: "1rem",
      fontWeight: "500"
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          input:focus, select:focus {
            border-color: #2e7d32 !important;
          }
        `}
      </style>

      <h1 style={styles.header}>Farm Fresh Products</h1>

      {/* Quick Category Filters */}
      {popularCategories.length > 0 && (
        <div style={styles.quickFilters}>
          <button
            style={styles.quickFilterButton(filters.category === "all")}
            onClick={() => handleFilterChange("category", "all")}
          >
            All Products
          </button>
          {popularCategories.map((cat) => (
            <button
              key={cat}
              style={styles.quickFilterButton(filters.category === cat)}
              onClick={() => handleFilterChange("category", cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.filtersHeader}>
          <h3 style={styles.filtersTitle}>Filter Products</h3>
          <button 
            style={styles.refreshButton}
            onClick={refreshProducts}
            title="Refresh products"
          >
            🔄 Refresh
          </button>
        </div>
        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Category</label>
            <select
              style={styles.filterSelect}
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories && categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search Products</label>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search by name or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sort By</label>
            <select
              style={styles.filterSelect}
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Results Count */}
      {!loading && products.length > 0 && (
        <div style={styles.resultsCount}>
          Showing {products.length} {products.length === 1 ? "product" : "products"}
          {filters.category !== "all" && ` in ${filters.category}`}
          {filters.search && ` matching "${filters.search}"`}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div style={styles.productGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={styles.skeletonCard}>
              <div style={{ ...styles.skeleton, height: "220px" }}></div>
              <div style={{ padding: "1.5rem" }}>
                <div style={{ ...styles.skeleton, height: "24px", marginBottom: "0.75rem" }}></div>
                <div style={{ ...styles.skeleton, height: "16px", marginBottom: "0.5rem" }}></div>
                <div style={{ ...styles.skeleton, height: "16px", width: "70%", marginBottom: "1rem" }}></div>
                <div style={{ ...styles.skeleton, height: "50px", marginBottom: "1rem" }}></div>
                <div style={{ ...styles.skeleton, height: "44px" }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={styles.empty}>
          <h3 style={styles.emptyTitle}>No Products Found</h3>
          <p style={styles.emptyText}>
            {filters.category !== "all" || filters.search
              ? "Try adjusting your search filters or check back later for new listings."
              : "No products available at the moment. Check back later for new listings."}
          </p>
          {(filters.category !== "all" || filters.search) && (
            <button
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                background: "#2e7d32",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
              onClick={() => setFilters({ category: "all", search: "", sortBy: "newest" })}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={styles.productGrid}>
          {products.map((product) => {
            const isHovered = hoveredCard === product.product_id;
            const initials = `${product.first_name?.[0] || ''}${product.last_name?.[0] || ''}`.toUpperCase();
            const farmerName = `${product.first_name || ''} ${product.last_name || ''}`.trim() || product.username || 'Unknown Farmer';

            return (
              <div
                key={product.product_id}
                style={styles.card(isHovered)}
                onMouseEnter={() => setHoveredCard(product.product_id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={styles.imageContainer}>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      style={styles.image(isHovered)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div style={styles.stockBadge(product.stock_quantity)}>
                    {product.stock_quantity > 0
                      ? `${product.stock_quantity} Available`
                      : "Out of Stock"}
                  </div>
                </div>

                <div style={styles.info}>
                  <h3 style={styles.name}>{product.product_name}</h3>
                  
                  <p style={styles.description}>
                    {product.description?.length > 100
                      ? `${product.description.substring(0, 100)}...`
                      : product.description || "No description available"}
                  </p>

                  <div style={styles.farmerSection}>
                    <div style={styles.farmerIcon}>{initials}</div>
                    <div style={styles.farmerInfo}>
                      <span style={styles.farmerLabel}>Sold By</span>
                      <span style={styles.farmerName}>
                        {farmerName}
                      </span>
                    </div>
                  </div>

                  <div style={styles.priceRow}>
                    <div style={styles.price}>₹{product.price}</div>
                  </div>

                  <button
                    style={styles.addButton(product.stock_quantity === 0, isHovered)}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock_quantity === 0}
                    onMouseEnter={(e) => {
                      if (product.stock_quantity > 0) {
                        e.currentTarget.style.background = "#1b5e20";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (product.stock_quantity > 0) {
                        e.currentTarget.style.background = "#2e7d32";
                      }
                    }}
                  >
                    {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductList;