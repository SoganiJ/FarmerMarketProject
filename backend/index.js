// === IMPORTS ===
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// === CONFIGURATION ===
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");

const WEATHER_API_KEY = "30d4741c779ba94c470ca1f63045390a";
const CSV_FILE_PATH = "latest_stock_data.csv";

async function getFarmerAdvice(crop_name, district, state, crop_status) {
  try {
    const rows = [];
    if (!fs.existsSync(CSV_FILE_PATH)) {
      return { error: "The 'latest_stock_data.csv' file was not found." };
    }

    // Step 1: Read CSV data
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    const cropNameTitle =
      crop_name.trim().charAt(0).toUpperCase() + crop_name.trim().slice(1).toLowerCase();
    const filtered = rows.filter(
      (r) =>
        r.Commodity?.trim().toLowerCase() === cropNameTitle.toLowerCase() &&
        r.District?.trim().toLowerCase() === district.trim().toLowerCase()
    );

    if (filtered.length === 0) {
      return { advice: `No mandi price data found for ${crop_name} in ${district}.` };
    }

    const latest = filtered[filtered.length - 1];
    const mandi_price_quintal = parseFloat(latest.Modal_Price);
    const mandi_price_per_kg = mandi_price_quintal / 100;

    // Step 2: Fetch weather data
    let temperature = null,
      humidity = null,
      weather_condition = "Not available";
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${district},${state},IN&appid=${WEATHER_API_KEY}&units=metric`;
      const res = await axios.get(url);
      temperature = res.data.main.temp;
      humidity = res.data.main.humidity;
      weather_condition = res.data.weather[0].description;
    } catch {
      console.log("Weather API unavailable, skipping...");
    }

    // Step 3: Generate advice
    const isHealthy = crop_status.toLowerCase().includes("healthy");
    let advice = "General advice: Monitor market trends and weather forecasts closely.";

    if (isHealthy) {
      if (temperature && temperature >= 20 && temperature <= 30 && humidity >= 40 && humidity <= 70) {
        advice = `Weather is good for storage. Current Mandi Price is ₹${mandi_price_per_kg.toFixed(
          2
        )}/kg. Consider waiting if prices are low.`;
      } else if (mandi_price_per_kg > 25) {
        advice = `Price is high at ₹${mandi_price_per_kg.toFixed(2)}/kg! This is a good time to sell.`;
      } else {
        advice = `Crop is healthy. Current price is ₹${mandi_price_per_kg.toFixed(
          2
        )}/kg. You can choose to sell now or store and wait for better prices.`;
      }
    } else {
      advice = `Crop is diseased. It is highly recommended to sell now at the current price of ₹${mandi_price_per_kg.toFixed(
        2
      )}/kg to avoid further losses.`;
    }

    return {
      advice,
      mandi_price: `₹${mandi_price_per_kg.toFixed(2)}`,
      mandi_price_quintal: `₹${mandi_price_quintal}`,
      temperature: temperature ? `${temperature}°C` : "Not available",
      humidity: humidity ? `${humidity}%` : "Not available",
      weather_condition,
    };
  } catch (err) {
    return { error: `Error processing request: ${err.message}` };
  }
}


// === ORDER ID GENERATION ===
function generateOrderId() {
    const date = new Date();
    const datePart = date.toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
}

// === STOCK MANAGEMENT CONSTANTS ===
const LOW_STOCK_THRESHOLD = 10;

// === MIDDLEWARE ===
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://farmer-market-project.vercel.app" // ✅ your live frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));


app.options(/.*/, cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === DATABASE CONNECTION ===
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => console.log("✅ Connected to PostgreSQL successfully"));
pool.on('error', err => console.error("❌ Database pool error:", err));

// === GROQ AI CONFIGURATION ===
const OpenAI = require('openai');
const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

// === MULTER CONFIGURATION ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// === AUTHENTICATION MIDDLEWARE ===
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// === STOCK HELPER FUNCTIONS ===
function getStockStatus(stockQuantity) {
    if (stockQuantity <= 0) {
        return 'out_of_stock';
    } else if (stockQuantity <= LOW_STOCK_THRESHOLD) {
        return 'low_stock';
    } else {
        return 'in_stock';
    }
}

async function updateProductStockStatus(productId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const productResult = await client.query(
            "SELECT stock_quantity FROM products WHERE product_id = $1",
            [productId]
        );
        
        if (productResult.rows.length === 0) {
            throw new Error("Product not found");
        }

        const stockQuantity = Math.max(0, productResult.rows[0].stock_quantity);
        const stockStatus = getStockStatus(stockQuantity);

        await client.query(
            "UPDATE products SET stock_status = $1, stock_quantity = $2 WHERE product_id = $3",
            [stockStatus, stockQuantity, productId]
        );

        await client.query('COMMIT');
        return stockStatus;
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error updating stock status:", err);
        throw err;
    } finally {
        client.release();
    }
}

// === TEST DATABASE ROUTE ===
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ success: true, db_time: result.rows[0].now });
    } catch (err) {
        console.error("Database test error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// === API ENDPOINTS ===

/* * 1. REGISTER A NEW USER */
app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password, user_type, first_name, last_name, address } = req.body;

        if (!username || !email || !password || !user_type || !first_name || !last_name) {
            return res.status(400).json({ message: "All required fields must be filled." });
        }

        const existingUserResult = await pool.query(
            "SELECT * FROM users WHERE email = $1 OR username = $2",
            [email, username]
        );
        
        if (existingUserResult.rows.length > 0) {
            return res.status(409).json({ message: "Email or username already in use." });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO users (username, email, password_hash, user_type, first_name, last_name, address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING user_id
        `;
        const result = await pool.query(query, [username, email, passwordHash, user_type, first_name, last_name, address || null]);
        const newUserId = result.rows[0].user_id;

        if (!JWT_SECRET) {
            return res.status(201).json({ message: "User registered! Please log in." });
        }

        const token = jwt.sign({ userId: newUserId, username: username, role: user_type }, JWT_SECRET, { expiresIn: '1h' });

        console.log(`New user registered: ${username} (ID: ${newUserId})`);

        res.status(201).json({
            message: "User registered successfully!",
            token: token,
            userType: user_type,
            userId: newUserId,
            username: username
        });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Server error during registration." });
    }
});

/* * 2. LOGIN A USER */
app.post("/api/login", async (req, res) => {
    if (!JWT_SECRET) {
        return res.status(500).json({ message: "Server configuration error." });
    }

    try {
        const { email, password } = req.body;
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = result.rows[0];
        if (!user.password_hash) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: user.user_id, username: user.username, role: user.user_type }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: "Login successful!",
            token: token,
            userType: user.user_type,
            userId: user.user_id,
            username: user.username
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error during login." });
    }
});

/* * 3A. GET ALL PRODUCTS WITH FILTERING */
app.get("/api/products", async (req, res) => {
    try {
        const { category, search, sort, stock_status } = req.query;
        
        let query = `
            SELECT p.product_id, p.product_name, p.description, p.price, p.stock_quantity, p.stock_status,
                   p.category, p.image_url, p.created_at, u.user_id, u.first_name, u.last_name, u.username
            FROM products p JOIN users u ON p.farmer_id = u.user_id WHERE p.is_active = true
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (category && category !== 'all') {
            paramCount++;
            query += ` AND p.category = $${paramCount}`;
            params.push(category);
        }
        
        if (search && search.trim() !== '') {
            paramCount++;
            const searchTerm = `%${search}%`;
            query += ` AND (p.product_name LIKE $${paramCount} OR p.description LIKE $${paramCount + 1})`;
            params.push(searchTerm, searchTerm);
            paramCount++;
        }

        if (stock_status && stock_status !== 'all') {
            paramCount++;
            query += ` AND p.stock_status = $${paramCount}`;
            params.push(stock_status);
        }
        
        switch (sort) {
            case 'price_low': query += ` ORDER BY p.price ASC`; break;
            case 'price_high': query += ` ORDER BY p.price DESC`; break;
            case 'name': query += ` ORDER BY p.product_name ASC`; break;
            case 'stock_low': query += ` ORDER BY p.stock_quantity ASC`; break;
            case 'newest':
            default: query += ` ORDER BY p.created_at DESC`; break;
        }
        
        const result = await pool.query(query, params);

        const productsWithFullImagePaths = result.rows.map(product => {
            if (product.image_url && !product.image_url.startsWith('http')) {
                return {
                    ...product,
                    image_url: `https://farmermarketproject.onrender.com/uploads/${product.image_url}`
                };
            }
            return product;
        });

        res.json(productsWithFullImagePaths);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ message: "Error fetching products" });
    }
});

/* * 3B. ADD A NEW PRODUCT */
app.post("/api/products", verifyToken, upload.single("image"), async (req, res) => {
    const { userId: farmer_id, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can add products." });
    }

    const { product_name, description, price, stock_quantity, category } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!product_name || !description || !price || !stock_quantity || !category) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const safeStockQuantity = Math.max(0, parseInt(stock_quantity));
    const stock_status = getStockStatus(safeStockQuantity);

    try {
        const query = `INSERT INTO products (product_name, description, price, stock_quantity, stock_status, farmer_id, category, image_url, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`;
        await pool.query(query, [product_name, description, price, safeStockQuantity, stock_status, farmer_id, category, image_url]);

        res.status(201).json({ message: "Product added successfully!" });

    } catch (err) {
        console.error("Add Product Error:", err);
        res.status(500).json({ message: "Server error adding product." });
    }
});

/* * 4. GET USER PROFILE */
app.get("/api/profile", verifyToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const query = "SELECT user_id, username, email, first_name, last_name, address, user_type FROM users WHERE user_id = $1";
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).json({ message: "Server error fetching profile." });
    }
});

/* * 5. UPDATE USER PROFILE */
app.put("/api/profile", verifyToken, async (req, res) => {
    const { userId } = req.user;
    const { first_name, last_name, address } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ message: "First name and last name are required." });
    }

    try {
        const query = `UPDATE users SET first_name = $1, last_name = $2, address = $3 WHERE user_id = $4`;
        await pool.query(query, [first_name, last_name, address, userId]);

        console.log(`User profile updated: ${userId}`);
        res.json({ message: "Profile updated successfully!" });

    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ message: "Server error updating profile." });
    }
});

/* * GET ALL PRODUCT CATEGORIES */
app.get("/api/categories", async (req, res) => {
    try {
        const result = await pool.query("SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC");
        const categories = result.rows.map(row => row.category);
        res.json(categories);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ message: "Server error fetching categories." });
    }
});

// === PRICE ADVICE ENDPOINT ===
app.get("/api/price-advice", async (req, res) => {
  const { crop_name, district, state, crop_status } = req.query;

  if (!crop_name || !district || !state || !crop_status) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const result = await getFarmerAdvice(crop_name, district, state, crop_status);
  res.json(result);
});

// === FARMER-SPECIFIC ENDPOINTS ===

/* * 6. GET FARMER'S OWN PRODUCTS */
app.get("/api/farmer/products", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access this resource." });
    }

    try {
        const query = `SELECT p.*, COALESCE(SUM(oi.quantity), 0) as total_sold FROM products p LEFT JOIN order_items oi ON p.product_id = oi.product_id WHERE p.farmer_id = $1 GROUP BY p.product_id ORDER BY p.created_at DESC`;
        const result = await pool.query(query, [userId]);

        const productsWithFullImagePaths = result.rows.map(product => {
            if (product.image_url) {
                return {
                    ...product,
                    image_url: `https://farmermarketproject.onrender.com/uploads/${product.image_url}`
                };
            }
            return product;
        });

        res.json(productsWithFullImagePaths);
    } catch (err) {
        console.error("Error fetching farmer products:", err);
        res.status(500).json({ message: "Error fetching products" });
    }
});

/* * 7. GET FARMER SALES DATA */
app.get("/api/farmer/sales", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access this resource." });
    }

    try {
        const revenueQuery = `SELECT COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as totalRevenue FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE p.farmer_id = $1`;
        const revenueResult = await pool.query(revenueQuery, [userId]);

        const bestProductQuery = `
            SELECT p.product_id, p.product_name, SUM(oi.quantity) as total_sold,
                   SUM(oi.quantity * oi.price_at_purchase) as total_revenue
            FROM order_items oi JOIN products p ON oi.product_id = p.product_id 
            WHERE p.farmer_id = $1 GROUP BY p.product_id, p.product_name ORDER BY total_sold DESC LIMIT 1`;
        const bestProductResult = await pool.query(bestProductQuery, [userId]);

        const stockStatsQuery = `
            SELECT COUNT(*) as total_products,
                   SUM(CASE WHEN stock_status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_count,
                   SUM(CASE WHEN stock_status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count,
                   SUM(CASE WHEN stock_status = 'in_stock' THEN 1 ELSE 0 END) as in_stock_count
            FROM products WHERE farmer_id = $1`;
        const stockStatsResult = await pool.query(stockStatsQuery, [userId]);

        res.json({
            totalRevenue: revenueResult.rows[0].totalrevenue || 0,
            bestProduct: bestProductResult.rows[0] || null,
            stockStats: stockStatsResult.rows[0] || { total_products: 0, out_of_stock_count: 0, low_stock_count: 0, in_stock_count: 0 }
        });
    } catch (err) {
        console.error("Error fetching sales data:", err);
        res.status(500).json({ message: "Error fetching sales data" });
    }
});

/* * 8. UPDATE PRODUCT */
app.put("/api/farmer/products/:id", verifyToken, upload.single("image"), async (req, res) => {
    const { userId, role } = req.user;
    const productId = req.params.id;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can update products." });
    }

    const { product_name, description, price, category } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!product_name || !description || !price || !category) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const ownershipCheck = await pool.query("SELECT farmer_id FROM products WHERE product_id = $1", [productId]);
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        if (ownershipCheck.rows[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only update your own products." });
        }

        let query, params;
        if (image_url) {
            query = `UPDATE products SET product_name = $1, description = $2, price = $3, category = $4, image_url = $5 WHERE product_id = $6`;
            params = [product_name, description, price, category, image_url, productId];
        } else {
            query = `UPDATE products SET product_name = $1, description = $2, price = $3, category = $4 WHERE product_id = $5`;
            params = [product_name, description, price, category, productId];
        }

        await pool.query(query, params);
        res.json({ message: "Product updated successfully!" });

    } catch (err) {
        console.error("Update Product Error:", err);
        res.status(500).json({ message: "Server error updating product." });
    }
});

/* * 9. DELETE PRODUCT */
app.delete("/api/farmer/products/:id", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const productId = req.params.id;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can delete products." });
    }

    try {
        const ownershipCheck = await pool.query("SELECT farmer_id FROM products WHERE product_id = $1", [productId]);
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        if (ownershipCheck.rows[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only delete your own products." });
        }

        await pool.query("DELETE FROM products WHERE product_id = $1", [productId]);
        res.json({ message: "Product deleted successfully!" });

    } catch (err) {
        console.error("Delete Product Error:", err);
        res.status(500).json({ message: "Server error deleting product." });
    }
});

/* * 10. UPDATE PRODUCT STOCK */
app.patch("/api/farmer/products/:id/stock", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const productId = req.params.id;
    const { quantity, action } = req.body;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can update stock." });
    }

    if (!quantity || isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ message: "Valid non-negative quantity is required." });
    }

    try {
        const ownershipCheck = await pool.query("SELECT farmer_id, stock_quantity FROM products WHERE product_id = $1", [productId]);
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        if (ownershipCheck.rows[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only update stock for your own products." });
        }

        let newStock;
        if (action === 'add') {
            newStock = parseInt(ownershipCheck.rows[0].stock_quantity) + parseInt(quantity);
        } else if (action === 'set') {
            newStock = parseInt(quantity);
        } else {
            return res.status(400).json({ message: "Invalid action. Use 'add' or 'set'." });
        }

        newStock = Math.max(0, newStock);
        const stockStatus = getStockStatus(newStock);
        
        await pool.query("UPDATE products SET stock_quantity = $1, stock_status = $2 WHERE product_id = $3", [newStock, stockStatus, productId]);

        res.json({ message: "Stock updated successfully!", newStock, stockStatus });

    } catch (err) {
        console.error("Update Stock Error:", err);
        res.status(500).json({ message: "Server error updating stock." });
    }
});

/* * 11. TOGGLE PRODUCT STATUS */
app.patch("/api/farmer/products/:id/status", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const productId = req.params.id;
    const { is_active } = req.body;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can update product status." });
    }

    try {
        const ownershipCheck = await pool.query("SELECT farmer_id FROM products WHERE product_id = $1", [productId]);
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        if (ownershipCheck.rows[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only update status for your own products." });
        }

        await pool.query("UPDATE products SET is_active = $1 WHERE product_id = $2", [is_active, productId]);
        res.json({ message: `Product ${is_active ? 'activated' : 'deactivated'} successfully!` });

    } catch (err) {
        console.error("Toggle Product Status Error:", err);
        res.status(500).json({ message: "Server error updating product status." });
    }
});

/* * 12. GET SALES REPORT */
app.get("/api/farmer/sales-report", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const { range = 'month' } = req.query;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access sales reports." });
    }

    try {
        let dateFilter;
        const now = new Date();

        switch (range) {
            case 'week': dateFilter = new Date(now.setDate(now.getDate() - 7)); break;
            case 'month': dateFilter = new Date(now.setMonth(now.getMonth() - 1)); break;
            case 'quarter': dateFilter = new Date(now.setMonth(now.getMonth() - 3)); break;
            case 'year': dateFilter = new Date(now.setFullYear(now.getFullYear() - 1)); break;
            default: dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        }

        const query = `SELECT p.product_id, p.product_name, SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.price_at_purchase) as total_revenue FROM order_items oi JOIN products p ON oi.product_id = p.product_id JOIN orders o ON oi.order_id = o.order_id WHERE p.farmer_id = $1 AND o.order_date >= $2 GROUP BY p.product_id, p.product_name ORDER BY total_revenue DESC`;
        const result = await pool.query(query, [userId, dateFilter]);
        res.json(result.rows);

    } catch (err) {
        console.error("Sales Report Error:", err);
        res.status(500).json({ message: "Server error fetching sales report." });
    }
});

/* * 17. CREATE ORDER WITH STOCK MANAGEMENT */
app.post("/api/orders", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    
    if (role !== 'customer') {
        return res.status(403).json({ message: "Only customers can place orders." });
    }

    const { items, total_amount, shipping_address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must contain items." });
    }

    if (!total_amount || total_amount <= 0) {
        return res.status(400).json({ message: "Valid total amount is required." });
    }

    if (!shipping_address || shipping_address.trim() === '') {
        return res.status(400).json({ message: "Shipping address is required." });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        for (const item of items) {
            const productResult = await client.query("SELECT product_id, price, stock_quantity, stock_status FROM products WHERE product_id = $1 AND is_active = true", [item.product_id]);
            if (productResult.rows.length === 0) {
                throw new Error(`Product ${item.product_id} not found or inactive`);
            }

            const product = productResult.rows[0];
            if (product.stock_status === 'out_of_stock') {
                throw new Error(`Product ${item.product_id} is out of stock`);
            }
            if (product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
            }
        }

        const orderNumber = generateOrderId();
        const orderResult = await client.query("INSERT INTO orders (user_id, order_number, total_amount, shipping_address, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING order_id", [userId, orderNumber, total_amount, shipping_address.trim()]);
        const orderId = orderResult.rows[0].order_id;

        for (const item of items) {
            const productResult = await client.query("SELECT price, stock_quantity FROM products WHERE product_id = $1", [item.product_id]);
            const product = productResult.rows[0];

            await client.query("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)", [orderId, item.product_id, item.quantity, product.price]);

            const newStock = Math.max(0, product.stock_quantity - item.quantity);
            const stockStatus = getStockStatus(newStock);
            await client.query("UPDATE products SET stock_quantity = $1, stock_status = $2 WHERE product_id = $3", [newStock, stockStatus, item.product_id]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: "Order placed successfully!",
            orderId: orderId,
            orderNumber: orderNumber,
            totalAmount: total_amount
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create Order Error:", err);
        
        if (err.message.includes('Insufficient stock') || err.message.includes('out of stock') || err.message.includes('not found')) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(500).json({ message: "Server error creating order." });
        }
    } finally {
        client.release();
    }
});

/* * 18. GET USER ORDERS */
app.get("/api/orders", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'customer') {
        return res.status(403).json({ message: "Only customers can view orders." });
    }

    try {
        const ordersQuery = `
            SELECT o.order_id, o.order_number, o.total_amount, o.shipping_address, o.status, o.order_date,
                   oi.order_item_id, oi.product_id, oi.quantity, oi.price_at_purchase as price,
                   p.product_name, p.image_url, u.first_name as farmer_first_name, u.last_name as farmer_last_name
            FROM orders o LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN users u ON p.farmer_id = u.user_id
            WHERE o.user_id = $1 ORDER BY o.order_date DESC`;

        const result = await pool.query(ordersQuery, [userId]);
        const ordersMap = new Map();
        
        result.rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    order_id: row.order_id, order_number: row.order_number, total_amount: row.total_amount,
                    shipping_address: row.shipping_address, status: row.status, order_date: row.order_date, items: []
                });
            }
            
            if (row.order_item_id) {
                ordersMap.get(row.order_id).items.push({
                    order_item_id: row.order_item_id, product_id: row.product_id, product_name: row.product_name,
                    quantity: row.quantity, price: row.price, image_url: row.image_url,
                    farmer_name: `${row.farmer_first_name || ''} ${row.farmer_last_name || ''}`.trim()
                });
            }
        });

        res.json(Array.from(ordersMap.values()));
    } catch (err) {
        console.error("Get Orders Error:", err);
        res.status(500).json({ message: "Error fetching orders." });
    }
});

/* * 19. GET PRODUCT SUGGESTIONS */
app.get("/api/products/suggestions", async (req, res) => {
    try {
        const { limit = 4 } = req.query;
        const query = `
            SELECT p.product_id, p.product_name, p.description, p.price, p.stock_quantity, p.stock_status,
                   p.category, p.image_url, u.first_name, u.last_name
            FROM products p JOIN users u ON p.farmer_id = u.user_id 
            WHERE p.stock_quantity > 0 AND p.is_active = true AND p.stock_status != 'out_of_stock'
            ORDER BY RANDOM() LIMIT $1`;
        
        const result = await pool.query(query, [parseInt(limit)]);

        const productsWithFullImagePaths = result.rows.map(product => {
            if (product.image_url && !product.image_url.startsWith('http')) {
                return { ...product, image_url: `https://farmermarketproject.onrender.com/uploads/${product.image_url}` };
            }
            return product;
        });

        res.json(productsWithFullImagePaths);
    } catch (err) {
        console.error("Error fetching product suggestions:", err);
        res.status(500).json({ message: "Error fetching product suggestions" });
    }
});

/* * 20. GET FARMER ORDERS */
app.get("/api/farmer/orders", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access this resource." });
    }

    try {
        const query = `
            SELECT o.order_id, o.order_number, o.total_amount, o.shipping_address, o.status, o.order_date,
                   oi.order_item_id, oi.product_id, oi.quantity, oi.price_at_purchase as price,
                   p.product_name, p.image_url, u.first_name as customer_first_name, u.last_name as customer_last_name, u.email as customer_email
            FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            JOIN users u ON o.user_id = u.user_id
            WHERE p.farmer_id = $1 ORDER BY o.order_date DESC`;

        const result = await pool.query(query, [userId]);
        const ordersMap = new Map();
        
        result.rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    order_id: row.order_id, order_number: row.order_number, total_amount: row.total_amount,
                    shipping_address: row.shipping_address, status: row.status, order_date: row.order_date,
                    customer_name: `${row.customer_first_name} ${row.customer_last_name}`, customer_email: row.customer_email, items: []
                });
            }
            
            ordersMap.get(row.order_id).items.push({
                order_item_id: row.order_item_id, product_id: row.product_id, product_name: row.product_name,
                quantity: row.quantity, price: row.price, image_url: row.image_url
            });
        });

        res.json(Array.from(ordersMap.values()));
    } catch (err) {
        console.error("Get Farmer Orders Error:", err);
        res.status(500).json({ message: "Error fetching orders." });
    }
});

/* * 21. UPDATE ORDER STATUS */
app.patch("/api/farmer/orders/:id/status", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const orderId = req.params.id;
    const { status } = req.body;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can update order status." });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
    }

    try {
        const verifyQuery = `SELECT COUNT(*) as product_count FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = $1 AND p.farmer_id = $2`;
        const verifyResult = await pool.query(verifyQuery, [orderId, userId]);

        if (verifyResult.rows[0].product_count === 0) {
            return res.status(403).json({ message: "You can only update orders containing your products." });
        }

        await pool.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2", [status, orderId]);
        res.json({ message: `Order status updated to ${status}` });

    } catch (err) {
        console.error("Update Order Status Error:", err);
        res.status(500).json({ message: "Error updating order status." });
    }
});

/* * 22. GET FARMER SALES ANALYTICS */
app.get("/api/farmer/analytics", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const { period = 'month' } = req.query;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access analytics." });
    }

    try {
        let dateFilter;
        const now = new Date();

        switch (period) {
            case 'week': dateFilter = new Date(now.setDate(now.getDate() - 7)); break;
            case 'month': dateFilter = new Date(now.setMonth(now.getMonth() - 1)); break;
            case 'quarter': dateFilter = new Date(now.setMonth(now.getMonth() - 3)); break;
            case 'year': dateFilter = new Date(now.setFullYear(now.getFullYear() - 1)); break;
            default: dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        }

        const salesQuery = `
            SELECT p.product_id, p.product_name, p.category, p.stock_status, SUM(oi.quantity) as total_sold,
                   SUM(oi.quantity * oi.price_at_purchase) as total_revenue, AVG(oi.price_at_purchase) as avg_price,
                   COUNT(DISTINCT o.order_id) as order_count
            FROM order_items oi JOIN products p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE p.farmer_id = $1 AND o.order_date >= $2
            GROUP BY p.product_id, p.product_name, p.category, p.stock_status ORDER BY total_revenue DESC`;
        const salesResult = await pool.query(salesQuery, [userId, dateFilter]);

        const customerQuery = `
            SELECT COUNT(DISTINCT o.user_id) as total_customers, COUNT(DISTINCT o.order_id) as total_orders,
                   AVG(o.total_amount) as avg_order_value
            FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE p.farmer_id = $1 AND o.order_date >= $2`;
        const customerStats = await pool.query(customerQuery, [userId, dateFilter]);

        const stockAnalyticsQuery = `SELECT stock_status, COUNT(*) as product_count, SUM(stock_quantity) as total_quantity FROM products WHERE farmer_id = $1 GROUP BY stock_status`;
        const stockAnalytics = await pool.query(stockAnalyticsQuery, [userId]);

        const totalRevenue = salesResult.rows.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
        const totalItemsSold = salesResult.rows.reduce((sum, item) => sum + parseInt(item.total_sold || 0), 0);
        const topProduct = salesResult.rows[0] || null;

        res.json({
            period, salesData: salesResult.rows, stockAnalytics: stockAnalytics.rows,
            customerStats: customerStats.rows[0] || { total_customers: 0, total_orders: 0, avg_order_value: 0 },
            summary: { totalRevenue, totalItemsSold, topProduct }
        });

    } catch (err) {
        console.error("Get Farmer Analytics Error:", err);
        res.status(500).json({ message: "Error fetching analytics." });
    }
});

/* * 23. GET PRODUCT SALES SUMMARY USING VIEW */
app.get("/api/analytics/product-sales", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    try {
        let query, params = [];
        if (role === 'farmer') {
            query = "SELECT * FROM ProductSalesSummary WHERE farmer_id = $1 ORDER BY total_revenue DESC";
            params = [userId];
        } else if (role === 'customer') {
            query = "SELECT * FROM ProductSalesSummary WHERE stock_status != 'out_of_stock' ORDER BY total_sold DESC LIMIT 50";
        } else {
            return res.status(403).json({ message: "Access denied" });
        }

        const result = await pool.query(query, params);
        const productsWithImages = result.rows.map(product => ({
            ...product,
            image_url: product.image_url ? `https://farmermarketproject.onrender.com/uploads/${product.image_url}` : null
        }));

        res.json(productsWithImages);
    } catch (err) {
        console.error("Product Sales Summary Error:", err);
        res.status(500).json({ message: "Error fetching product sales summary" });
    }
});

/* * 24. GET FARMER PERFORMANCE DASHBOARD USING VIEW */
app.get("/api/analytics/farmer-performance", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access performance data" });
    }

    try {
        const query = "SELECT * FROM FarmerPerformance WHERE farmer_id = $1";
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Performance data not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Farmer Performance Error:", err);
        res.status(500).json({ message: "Error fetching farmer performance" });
    }
});

/* * 29. SYNC ALL STOCK STATUS */
app.post("/api/admin/update-stock-status", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        await pool.query('CALL UpdateAllProductStockStatus()');
        res.json({ message: "All product stock status updated successfully using cursor", method: "cursor_procedure" });
    } catch (err) {
        console.error("Update Stock Status Error:", err);
        res.status(500).json({ message: "Error updating stock status" });
    }
});

/* * 32. GET ENHANCED ANALYTICS WITH VIEWS */
app.get("/api/analytics/enhanced", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const performanceResult = await pool.query("SELECT * FROM FarmerPerformance WHERE farmer_id = $1", [userId]);
        const salesResult = await pool.query("SELECT * FROM ProductSalesSummary WHERE farmer_id = $1 ORDER BY total_revenue DESC LIMIT 10", [userId]);

        res.json({
            performance: performanceResult.rows[0] || {},
            topProducts: salesResult.rows,
            analyticsSource: "database_views",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Enhanced Analytics Error:", err);
        res.status(500).json({ message: "Error fetching enhanced analytics" });
    }
});

// === CHATBOT API ENDPOINTS ===

/* * SEND A CHAT MESSAGE */
app.post("/api/chat/send", verifyToken, async (req, res) => {
    const { userId } = req.user;
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Message cannot be empty." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query("INSERT INTO chathistory (user_id, role, text) VALUES ($1, 'user', $2)", [userId, message.trim()]);

        const chatCompletion = await groqClient.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a helpful assistant for farmers named Krushi Sathi. Provide concise, practical advice on agriculture, crops, weather, and government schemes in India.' },
                { role: 'user', content: message.trim() },
            ],
            model: 'llama-3.1-8b-instant',
        });

        const aiResponseText = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that request.";
        const aiResult = await client.query("INSERT INTO chathistory (user_id, role, text) VALUES ($1, 'model', $2) RETURNING message_id", [userId, aiResponseText]);

        await client.query('COMMIT');

        res.status(200).json({
            response: aiResponseText,
            timestamp: new Date().toISOString(),
            message_id: aiResult.rows[0].message_id
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Chat API Error:', error);
        res.status(500).json({ message: "Failed to get a response from the assistant." });
    } finally {
        client.release();
    }
});

/* * GET CHAT HISTORY */
app.get("/api/chat/history", verifyToken, async (req, res) => {
    const { userId } = req.user;
    try {
        const query = `SELECT message_id, role, text, timestamp FROM chathistory WHERE user_id = $1 ORDER BY timestamp ASC`;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: "Failed to load chat history." });
    }
});

/* * DELETE CHAT HISTORY */
app.delete("/api/chat/history", verifyToken, async (req, res) => {
    const { userId } = req.user;
    try {
        await pool.query("DELETE FROM chathistory WHERE user_id = $1", [userId]);
        res.status(200).json({ message: "Chat history cleared successfully." });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ message: "Failed to clear chat history." });
    }
});

// === SERVER STARTUP ===
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}