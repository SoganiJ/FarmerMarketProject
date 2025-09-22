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
  });

  // NEW: State for dynamic categories, loading feedback, and image preview
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // NEW: Ref for the file input to allow for programmatic clearing
  const fileInputRef = useRef(null);

  // NEW: Fetch categories from the backend when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/categories");
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


  // --- INLINE STYLES (with additions for new features) ---
  const styles = {
    formContainer: {
      maxWidth: "650px",
      margin: "2rem auto",
      padding: "2rem",
      background: "#f9fdf9",
      borderRadius: "12px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
      border: "1px solid #eee",
      transition: "all 0.3s ease",
    },
    heading: {
      textAlign: "center",
      color: "#2E7D32",
      fontSize: "1.5rem",
      marginBottom: "1.5rem",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    },
    label: {
      fontWeight: 600,
      fontSize: "0.9rem",
      color: "#333",
      textAlign: "left",
    },
    input: {
      padding: "0.75rem",
      border: "1px solid #ccc",
      borderRadius: "6px",
      fontSize: "1rem",
      fontFamily: "inherit",
      transition: "border-color 0.2s ease",
    },
    textarea: {
      padding: "0.75rem",
      border: "1px solid #ccc",
      borderRadius: "6px",
      fontSize: "1rem",
      fontFamily: "inherit",
      minHeight: "100px",
      resize: "vertical",
    },
    select: {
      padding: "0.75rem",
      border: "1px solid #ccc",
      borderRadius: "6px",
      fontSize: "1rem",
      fontFamily: "inherit",
    },
    button: {
      padding: "0.85rem",
      backgroundColor: "#2E7D32",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "1rem",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
    // NEW: Style for disabled button
    buttonDisabled: {
        backgroundColor: "#9e9e9e",
        cursor: "not-allowed",
    },
    message: {
      textAlign: "center",
      fontWeight: "bold",
      marginTop: "1rem",
      padding: "0.75rem",
      borderRadius: "6px",
    },
    success: {
      color: "#2E7D32",
      backgroundColor: "#e8f5e9",
    },
    error: {
      color: "#d32f2f",
      backgroundColor: "#ffebee",
    },
    // NEW: Styles for image preview
    imagePreviewContainer: {
        marginTop: "0.5rem",
        textAlign: "center",
    },
    imagePreview: {
        maxWidth: "150px",
        maxHeight: "150px",
        borderRadius: "8px",
        border: "2px solid #ddd",
        objectFit: "cover",
    }
  };
  // --- END INLINE STYLES ---

  // ENHANCED: Handle file input and create a preview URL
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      // Create a URL for the selected file to show a preview
      if (file) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ENHANCED: Handle loading state and improved form reset
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setIsLoading(true); // Start loading

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({
        text: "You must be logged in to add a product.",
        type: "error",
      });
      setIsLoading(false); // Stop loading
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

      const response = await fetch("http://localhost:3001/api/products", {
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

      // ENHANCED: Clear form, image preview, and file input
      setFormData({
        product_name: "",
        description: "",
        price: "",
        stock_quantity: "",
        category: "",
        image: null,
      });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  return (
    <div style={styles.formContainer}>
      <h3 style={styles.heading}>Add a New Product</h3>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="product_name" style={styles.label}>
            Product Name
          </label>
          <input
            type="text"
            id="product_name"
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            style={styles.input}
            required
            disabled={isLoading}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="description" style={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={styles.textarea}
            required
            disabled={isLoading}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="price" style={styles.label}>
            Price ($)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            style={styles.input}
            min="0.01"
            step="0.01"
            required
            disabled={isLoading}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="stock_quantity" style={styles.label}>
            Stock Quantity
          </label>
          <input
            type="number"
            id="stock_quantity"
            name="stock_quantity"
            value={formData.stock_quantity}
            onChange={handleChange}
            style={styles.input}
            min="0"
            step="1"
            required
            disabled={isLoading}
          />
        </div>

        {/* CORRECTED & ENHANCED: Dynamic category dropdown */}
        <div style={styles.formGroup}>
          <label htmlFor="category" style={styles.label}>
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={styles.select}
            required
            disabled={isLoading}
          >
            <option value="">Select category</option>
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

        <div style={styles.formGroup}>
          <label htmlFor="image" style={styles.label}>
            Upload Image
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleChange}
            style={styles.input}
            ref={fileInputRef} // Added ref
            disabled={isLoading}
          />
        </div>
        
        {/* NEW: Show image preview */}
        {imagePreview && (
            <div style={styles.imagePreviewContainer}>
                <img src={imagePreview} alt="Product preview" style={styles.imagePreview} />
            </div>
        )}

        <button 
            type="submit" 
            style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}}
            disabled={isLoading}
        >
          {isLoading ? "Adding Product..." : "Add Product"}
        </button>

        {message.text && (
          <div
            style={{
              ...styles.message,
              ...(message.type === "success" ? styles.success : styles.error),
            }}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}

export default AddProductForm;
