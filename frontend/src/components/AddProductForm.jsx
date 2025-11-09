// In frontend/src/components/AddProductForm.jsx
import React, { useState, useEffect, useRef } from "react";

function AddProductForm({ onProductAdded }) {
  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    image: null,
    crop_status: "healthy", // New field for crop status
    district: "", // New field for district
    state: "", // New field for state
  });

  // State for dynamic categories, loading feedback, and image preview
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [focusedField, setFocusedField] = useState("");
  const [priceAdvice, setPriceAdvice] = useState(null); // New state for price advice
  const [isFetchingAdvice, setIsFetchingAdvice] = useState(false); // Loading state for advice

  // Ref for the file input to allow for programmatic clearing
  const fileInputRef = useRef(null);

  // Fetch categories from the backend when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`);
        if (!response.ok) {
          throw new Error("Could not fetch categories.");
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setMessage({ text: "Could not load categories from server.", type: "error" });
      }
    };
    fetchCategories();
  }, []);

  // Fetch price advice when product name, district, state, or crop status changes
  useEffect(() => {
    const fetchPriceAdvice = async () => {
      if (formData.product_name && formData.district && formData.state && formData.crop_status) {
        setIsFetchingAdvice(true);
        try {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/price-advice?crop_name=${encodeURIComponent(formData.product_name)}&district=${encodeURIComponent(formData.district)}&state=${encodeURIComponent(formData.state)}&crop_status=${encodeURIComponent(formData.crop_status)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );


          if (response.ok) {
            const advice = await response.json();
            setPriceAdvice(advice);
            
            // Auto-fill price if available in advice and price field is empty
            if (advice.mandi_price && !formData.price) {
              const priceValue = advice.mandi_price.replace('₹', '').trim();
              if (!isNaN(priceValue) && priceValue > 0) {
                setFormData(prev => ({ ...prev, price: priceValue }));
              }
            }
          } else {
            console.error("Failed to fetch price advice");
            setPriceAdvice(null);
          }
        } catch (error) {
          console.error("Error fetching price advice:", error);
          setPriceAdvice(null);
        } finally {
          setIsFetchingAdvice(false);
        }
      } else {
        setPriceAdvice(null);
      }
    };

    // Add debounce to avoid too many API calls
    const timeoutId = setTimeout(fetchPriceAdvice, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.product_name, formData.district, formData.state, formData.crop_status, formData.price]);

  // --- ENHANCED STYLES ---
  const styles = {
    container: {
      background: "linear-gradient(135deg, #f8fffe 0%, #f0f9f4 100%)",
      minHeight: "100vh",
      padding: "2rem 1rem",
    },
    formWrapper: {
      maxWidth: "900px",
      margin: "0 auto",
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "24px",
      overflow: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 8px 25px -8px rgba(0, 0, 0, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      backdropFilter: "blur(10px)",
    },
    header: {
      background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)",
      padding: "3rem 2rem",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    },
    headerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 20\"><defs><pattern id=\"grain\" width=\"100\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"5\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/><circle cx=\"30\" cy=\"15\" r=\"0.8\" fill=\"%23ffffff\" opacity=\"0.08\"/><circle cx=\"60\" cy=\"8\" r=\"1.2\" fill=\"%23ffffff\" opacity=\"0.06\"/><circle cx=\"80\" cy=\"12\" r=\"0.9\" fill=\"%23ffffff\" opacity=\"0.09\"/></pattern></defs><rect width=\"100\" height=\"20\" fill=\"url(%23grain)\"/></svg>') repeat",
      opacity: 0.3,
    },
    title: {
      color: "white",
      fontSize: "2.2rem",
      fontWeight: "700",
      margin: 0,
      letterSpacing: "-0.02em",
      position: "relative",
      zIndex: 1,
    },
    subtitle: {
      color: "rgba(255, 255, 255, 0.85)",
      fontSize: "1.1rem",
      marginTop: "0.5rem",
      fontWeight: "400",
      position: "relative",
      zIndex: 1,
    },
    formContent: {
      padding: "3rem 2rem",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "2rem",
      "@media (max-width: 768px)": {
        gridTemplateColumns: "1fr",
        gap: "1.5rem",
      }
    },
    fullWidth: {
      gridColumn: "1 / -1",
    },
    fieldGroup: {
      position: "relative",
    },
    label: {
      display: "block",
      fontSize: "0.95rem",
      fontWeight: "600",
      color: "#1b5e20",
      marginBottom: "0.75rem",
      letterSpacing: "0.01em",
    },
    inputWrapper: {
      position: "relative",
    },
    input: {
      width: "100%",
      padding: "1rem 1.25rem",
      border: "2px solid #e8f5e9",
      borderRadius: "16px",
      fontSize: "1rem",
      fontFamily: "inherit",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      background: "white",
      outline: "none",
      boxSizing: "border-box",
    },
    inputFocused: {
      borderColor: "#2e7d32",
      boxShadow: "0 0 0 4px rgba(46, 125, 50, 0.1)",
      transform: "translateY(-2px)",
    },
    textarea: {
      width: "100%",
      padding: "1rem 1.25rem",
      border: "2px solid #e8f5e9",
      borderRadius: "16px",
      fontSize: "1rem",
      fontFamily: "inherit",
      minHeight: "120px",
      resize: "vertical",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      background: "white",
      outline: "none",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      padding: "1rem 1.25rem",
      border: "2px solid #e8f5e9",
      borderRadius: "16px",
      fontSize: "1rem",
      fontFamily: "inherit",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      background: "white",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box",
    },
    fileInputWrapper: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "16px",
      border: "2px dashed #c8e6c9",
      background: "linear-gradient(135deg, #f8fffe 0%, #e8f5e9 100%)",
      transition: "all 0.3s ease",
      cursor: "pointer",
    },
    fileInputWrapperHover: {
      borderColor: "#2e7d32",
      background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
    },
    fileInput: {
      position: "absolute",
      opacity: 0,
      width: "100%",
      height: "100%",
      cursor: "pointer",
    },
    fileInputContent: {
      padding: "2rem",
      textAlign: "center",
      color: "#2e7d32",
    },
    fileInputText: {
      fontSize: "1rem",
      fontWeight: "500",
      marginTop: "0.5rem",
    },
    uploadIcon: {
      width: "48px",
      height: "48px",
      margin: "0 auto",
      color: "#2e7d32",
    },
    imagePreviewContainer: {
      marginTop: "1rem",
      textAlign: "center",
    },
    imagePreview: {
      maxWidth: "200px",
      maxHeight: "200px",
      borderRadius: "16px",
      border: "4px solid white",
      objectFit: "cover",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    },
    submitButton: {
      width: "100%",
      padding: "1.25rem 2rem",
      background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)",
      color: "white",
      border: "none",
      borderRadius: "16px",
      fontSize: "1.1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      marginTop: "2rem",
      letterSpacing: "0.02em",
      position: "relative",
      overflow: "hidden",
    },
    submitButtonHover: {
      transform: "translateY(-3px)",
      boxShadow: "0 15px 35px rgba(46, 125, 50, 0.4)",
    },
    submitButtonDisabled: {
      background: "linear-gradient(135deg, #9e9e9e 0%, #757575 100%)",
      cursor: "not-allowed",
      transform: "none",
      boxShadow: "none",
    },
    loadingSpinner: {
      display: "inline-block",
      width: "20px",
      height: "20px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTop: "2px solid white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginRight: "0.5rem",
    },
    message: {
      marginTop: "1.5rem",
      padding: "1rem 1.5rem",
      borderRadius: "12px",
      fontWeight: "500",
      textAlign: "center",
      border: "1px solid transparent",
    },
    messageSuccess: {
      background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
      color: "#1b5e20",
      border: "1px solid #a5d6a7",
    },
    messageError: {
      background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
      color: "#c62828",
      border: "1px solid #ef9a9a",
    },
    progressBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      height: "4px",
      background: "linear-gradient(90deg, #2e7d32, #4caf50)",
      transition: "width 0.3s ease",
      borderRadius: "0 0 16px 16px",
    },
    // New styles for price advice section
    priceAdviceContainer: {
      marginTop: "1rem",
      padding: "1.5rem",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
      border: "2px solid #90caf9",
    },
    priceAdviceTitle: {
      fontSize: "1.1rem",
      fontWeight: "600",
      color: "#1565c0",
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    priceAdviceContent: {
      fontSize: "0.95rem",
      color: "#0d47a1",
      lineHeight: "1.5",
    },
    priceAdviceLoading: {
      color: "#5d4037",
      fontStyle: "italic",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    priceAdviceError: {
      color: "#c62828",
      fontStyle: "italic",
    },
    adviceDetails: {
      marginTop: "1rem",
      padding: "1rem",
      background: "rgba(255, 255, 255, 0.7)",
      borderRadius: "8px",
      fontSize: "0.9rem",
    },
    adviceDetailRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "0.5rem",
    },
  };

  // Handle input focus
  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField("");
  };

  // Handle file input and create a preview URL
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      if (file) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle loading state and improved form reset
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setIsLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({
        text: "You must be logged in to add a product.",
        type: "error",
      });
      setIsLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("product_name", formData.product_name);
      fd.append("description", formData.description);
      fd.append("price", formData.price);
      fd.append("stock_quantity", formData.stock_quantity);
      fd.append("category", formData.category);
      if (formData.image) fd.append("image", formData.image);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add product.");

      setMessage({ text: data.message, type: "success" });

      if (onProductAdded) {
        onProductAdded();
      }

      // Clear form, image preview, and file input
      setFormData({
        product_name: "",
        description: "",
        price: "",
        stock_quantity: "",
        category: "",
        image: null,
        crop_status: "healthy",
        district: "",
        state: "",
      });
      setImagePreview(null);
      setPriceAdvice(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate form completion percentage
  const getFormCompletion = () => {
    const fields = ['product_name', 'description', 'price', 'stock_quantity', 'category', 'district', 'state'];
    const filledFields = fields.filter(field => formData[field] !== "").length;
    return (filledFields / fields.length) * 100;
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      
      <div style={styles.formWrapper}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerOverlay}></div>
          <h1 style={styles.title}>Add New Product</h1>
          <p style={styles.subtitle}>Share your harvest with the community</p>
          <div style={{...styles.progressBar, width: `${getFormCompletion()}%`}}></div>
        </div>

        {/* Form Content */}
        <div style={styles.formContent}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={styles.grid}>
              
              {/* Product Name */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Product Name</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    onFocus={() => handleFocus('product_name')}
                    onBlur={handleBlur}
                    style={{
                      ...styles.input,
                      ...(focusedField === 'product_name' ? styles.inputFocused : {})
                    }}
                    placeholder="e.g., Organic Tomatoes"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* District */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>District</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    onFocus={() => handleFocus('district')}
                    onBlur={handleBlur}
                    style={{
                      ...styles.input,
                      ...(focusedField === 'district' ? styles.inputFocused : {})
                    }}
                    placeholder="e.g., Pune"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* State */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>State</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    onFocus={() => handleFocus('state')}
                    onBlur={handleBlur}
                    style={{
                      ...styles.input,
                      ...(focusedField === 'state' ? styles.inputFocused : {})
                    }}
                    placeholder="e.g., Maharashtra"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Crop Status */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Crop Status</label>
                <select
                  name="crop_status"
                  value={formData.crop_status}
                  onChange={handleChange}
                  onFocus={() => handleFocus('crop_status')}
                  onBlur={handleBlur}
                  style={{
                    ...styles.select,
                    ...(focusedField === 'crop_status' ? styles.inputFocused : {})
                  }}
                  required
                  disabled={isLoading}
                >
                  <option value="healthy">Healthy</option>
                  <option value="diseased">Diseased</option>
                  <option value="moderate">Moderate</option>
                </select>
              </div>

              {/* Price */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Price per Unit (₹)</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    onFocus={() => handleFocus('price')}
                    onBlur={handleBlur}
                    style={{
                      ...styles.input,
                      ...(focusedField === 'price' ? styles.inputFocused : {})
                    }}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Category */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  onFocus={() => handleFocus('category')}
                  onBlur={handleBlur}
                  style={{
                    ...styles.select,
                    ...(focusedField === 'category' ? styles.inputFocused : {})
                  }}
                  required
                  disabled={isLoading}
                >
                  <option value="">Choose category</option>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading categories...</option>
                  )}
                  <option value="others">Others</option>
                </select>
              </div>

              {/* Stock Quantity */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Available Quantity</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    onFocus={() => handleFocus('stock_quantity')}
                    onBlur={handleBlur}
                    style={{
                      ...styles.input,
                      ...(focusedField === 'stock_quantity' ? styles.inputFocused : {})
                    }}
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{...styles.fieldGroup, ...styles.fullWidth}}>
                <label style={styles.label}>Product Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onFocus={() => handleFocus('description')}
                  onBlur={handleBlur}
                  style={{
                    ...styles.textarea,
                    ...(focusedField === 'description' ? styles.inputFocused : {})
                  }}
                  placeholder="Describe your product, growing methods, freshness, etc."
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Price Advice Section */}
              {formData.product_name && formData.district && formData.state && (
                <div style={{...styles.fieldGroup, ...styles.fullWidth}}>
                  <div style={styles.priceAdviceContainer}>
                    <div style={styles.priceAdviceTitle}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                      </svg>
                      Market Price Advice
                    </div>
                    
                    {isFetchingAdvice ? (
                      <div style={styles.priceAdviceLoading}>
                        <span style={styles.loadingSpinner}></span>
                        Analyzing market conditions...
                      </div>
                    ) : priceAdvice ? (
                      <div style={styles.priceAdviceContent}>
                        <p><strong>{priceAdvice.advice}</strong></p>
                        
                        {priceAdvice.mandi_price && (
                          <div style={styles.adviceDetails}>
                            <div style={styles.adviceDetailRow}>
                              <span>Current Mandi Price:</span>
                              <span><strong>{priceAdvice.mandi_price}</strong></span>
                            </div>
                            {priceAdvice.temperature && priceAdvice.temperature !== "Not available" && (
                              <div style={styles.adviceDetailRow}>
                                <span>Temperature:</span>
                                <span>{priceAdvice.temperature}</span>
                              </div>
                            )}
                            {priceAdvice.humidity && priceAdvice.humidity !== "Not available" && (
                              <div style={styles.adviceDetailRow}>
                                <span>Humidity:</span>
                                <span>{priceAdvice.humidity}</span>
                              </div>
                            )}
                            {priceAdvice.weather_condition && priceAdvice.weather_condition !== "Not available" && (
                              <div style={styles.adviceDetailRow}>
                                <span>Weather:</span>
                                <span>{priceAdvice.weather_condition}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {priceAdvice.error && (
                          <div style={styles.priceAdviceError}>
                            Note: {priceAdvice.error}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={styles.priceAdviceContent}>
                        Fill in product name, district, and state to get market advice.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div style={{...styles.fieldGroup, ...styles.fullWidth}}>
                <label style={styles.label}>Product Image</label>
                <div 
                  style={{
                    ...styles.fileInputWrapper,
                    ...(focusedField === 'image' ? styles.fileInputWrapperHover : {})
                  }}
                  onMouseEnter={() => handleFocus('image')}
                  onMouseLeave={handleBlur}
                >
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    style={styles.fileInput}
                    ref={fileInputRef}
                    disabled={isLoading}
                  />
                  <div style={styles.fileInputContent}>
                    <svg style={styles.uploadIcon} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    <p style={styles.fileInputText}>
                      {formData.image ? formData.image.name : "Click to upload product image"}
                    </p>
                  </div>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div style={styles.imagePreviewContainer}>
                    <img src={imagePreview} alt="Product preview" style={styles.imagePreview} />
                  </div>
                )}
              </div>

            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              style={{
                ...styles.submitButton,
                ...(isLoading ? styles.submitButtonDisabled : {}),
                ...(focusedField === 'submit' ? styles.submitButtonHover : {})
              }}
              onMouseEnter={() => handleFocus('submit')}
              onMouseLeave={handleBlur}
              disabled={isLoading}
            >
              {isLoading && <span style={styles.loadingSpinner}></span>}
              {isLoading ? "Adding Product..." : "Add Product to Market"}
            </button>

            {/* Message */}
            {message.text && (
              <div
                style={{
                  ...styles.message,
                  ...(message.type === "success" ? styles.messageSuccess : styles.messageError),
                }}
              >
                {message.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProductForm;