// === IMPORTS ===
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require('multer'); // For handling file uploads
const path = require('path');     // For handling file paths
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import Gemini AI library

// === CONFIGURATION ===
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// === ORDER ID GENERATION ===
function generateOrderId() {
    const date = new Date();
    const datePart = date.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 char random
    return `ORD-${datePart}-${randomPart}`;
}

// === STOCK MANAGEMENT CONSTANTS ===
const LOW_STOCK_THRESHOLD = 10; // Products with less than 10 items are considered low stock

// === MIDDLEWARE ===
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // PATCH is also needed for stock/status updates
    credentials: true
}));
app.use(express.json()); // Allows the server to read JSON data

// Serve static files (uploaded images) from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === DATABASE CONNECTION ===
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Test the connection
(async () => {
    try {
        await pool.query('SELECT 1');
        console.log("✅ Database connection successful!");
    } catch (err) {
        console.error("❌ Database connection failed:", err);
    }
})();

// === GROQ AI CONFIGURATION ===
const OpenAI = require('openai');

// Initialize Groq client with OpenAI-compatible format
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// === MULTER CONFIGURATION FOR FILE UPLOADS ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save files to 'uploads/' directory
    },
    filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ===================================
// === AUTHENTICATION MIDDLEWARE ===
// ===================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401); // Unauthorized (no token)
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden (token is invalid)
        }
        req.user = user;
        next();
    });
};

// ===================================
// === STOCK HELPER FUNCTIONS ===
// ===================================
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
    try {
        // Get current stock quantity
        const [productRows] = await pool.query(
            "SELECT stock_quantity FROM Products WHERE product_id = ?",
            [productId]
        );
        
        if (productRows.length === 0) {
            throw new Error("Product not found");
        }

        const stockQuantity = Math.max(0, productRows[0].stock_quantity); // Ensure non-negative
        const stockStatus = getStockStatus(stockQuantity);

        // Update stock status and ensure non-negative quantity
        await pool.query(
            "UPDATE Products SET stock_status = ?, stock_quantity = ? WHERE product_id = ?",
            [stockStatus, stockQuantity, productId]
        );

        return stockStatus;
    } catch (err) {
        console.error("Error updating stock status:", err);
        throw err;
    }
}
function updateProductStockStatus(productId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Get current stock quantity
            const [productRows] = await pool.query(
                "SELECT stock_quantity FROM Products WHERE product_id = ?",
                [productId]
            );
            
            if (productRows.length === 0) {
                reject(new Error("Product not found"));
                return;
            }

            const stockQuantity = productRows[0].stock_quantity;
            const stockStatus = getStockStatus(stockQuantity);

            // Update stock status
            await pool.query(
                "UPDATE Products SET stock_status = ? WHERE product_id = ?",
                [stockStatus, productId]
            );

            resolve(stockStatus);
        } catch (err) {
            reject(err);
        }
    });
}

// ===================================
// === API ENDPOINTS ===
// ===================================

/* * 1. REGISTER A NEW USER */
app.post("/api/register", async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            user_type,
            first_name,
            last_name,
            address
        } = req.body;

        if (!username || !email || !password || !user_type || !first_name || !last_name) {
            return res.status(400).json({ message: "All required fields must be filled." });
        }

        const [existingUser] = await pool.query("SELECT * FROM Users WHERE email = ? OR username = ?", [email, username]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: "Email or username already in use." });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `INSERT INTO Users (username, email, password_hash, user_type, first_name, last_name, address) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await pool.query(query, [
            username,
            email,
            passwordHash,
            user_type,
            first_name,
            last_name,
            address || null
        ]);

        const newUserId = result.insertId;

        if (!JWT_SECRET) {
             console.error("FATAL ERROR: JWT_SECRET is not defined.");
             return res.status(201).json({ message: "User registered! Please log in." });
        }

        const token = jwt.sign(
            {
                userId: newUserId,
                username: username,
                role: user_type
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

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

        if (err.code === 'WARN_DATA_TRUNCATED' || err.errno === 1265) {
             return res.status(400).json({ message: "Data is too long for a database field (check user_type)." });
        }
        if (err.code === 'ER_NO_DEFAULT_FOR_FIELD' || err.errno === 1364) {
            return res.status(400).json({ message: `A required database field is missing.` });
        }

        res.status(500).json({ message: "Server error during registration." });
    }
});

/* * 2. LOGIN A USER */
app.post("/api/login", async (req, res) => {
    if (!JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
        return res.status(500).json({ message: "Server configuration error." });
    }

    try {
        const { email, password } = req.body;

        const [users] = await pool.query("SELECT * FROM Users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = users[0];

        if (!user.password_hash) {
             console.error(`User ${email} has no password hash in DB.`);
             return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            {
                userId: user.user_id,
                username: user.username,
                role: user.user_type
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

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
            SELECT 
                p.product_id, 
                p.product_name, 
                p.description, 
                p.price, 
                p.stock_quantity, 
                p.stock_status,
                p.category, 
                p.image_url, 
                p.created_at,
                u.user_id,
                u.first_name,
                u.last_name,
                u.username
            FROM Products p 
            JOIN Users u ON p.farmer_id = u.user_id 
            WHERE p.is_active = 1
        `;
        
        const params = [];
        
        // Add category filter
        if (category && category !== 'all') {
            query += ` AND p.category = ?`;
            params.push(category);
        }
        
        // Add search filter
        if (search && search.trim() !== '') {
            query += ` AND (p.product_name LIKE ? OR p.description LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Add stock status filter
        if (stock_status && stock_status !== 'all') {
            query += ` AND p.stock_status = ?`;
            params.push(stock_status);
        }
        
        // Add sorting
        switch (sort) {
            case 'price_low':
                query += ` ORDER BY p.price ASC`;
                break;
            case 'price_high':
                query += ` ORDER BY p.price DESC`;
                break;
            case 'name':
                query += ` ORDER BY p.product_name ASC`;
                break;
            case 'stock_low':
                query += ` ORDER BY p.stock_quantity ASC`;
                break;
            case 'newest':
            default:
                query += ` ORDER BY p.created_at DESC`;
                break;
        }
        
        const [rows] = await pool.query(query, params);

        const productsWithFullImagePaths = rows.map(product => {
            if (product.image_url && !product.image_url.startsWith('http')) {
                return {
                    ...product,
                    image_url: `http://localhost:${PORT}/uploads/${product.image_url}`
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

    // Ensure stock quantity doesn't go below 0
    const safeStockQuantity = Math.max(0, parseInt(stock_quantity));
    const stock_status = getStockStatus(safeStockQuantity);

    try {
        const query = `INSERT INTO Products (product_name, description, price, stock_quantity, stock_status, farmer_id, category, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

        await pool.query(query, [
            product_name,
            description,
            price,
            safeStockQuantity,
            stock_status,
            farmer_id,
            category,
            image_url
        ]);

        res.status(201).json({ message: "Product added successfully!" });

    } catch (err) {
        console.error("Add Product Error:", err);
        res.status(500).json({ message: "Server error adding product." });
    }
});

/* * 4. GET USER PROFILE (Secure) */
app.get("/api/profile", verifyToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const query = "SELECT user_id, username, email, first_name, last_name, address, user_type FROM Users WHERE user_id = ?";
        const [users] = await pool.query(query, [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json(users[0]);
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).json({ message: "Server error fetching profile." });
    }
});

/* * 5. UPDATE USER PROFILE (Secure) */
app.put("/api/profile", verifyToken, async (req, res) => {
    const { userId } = req.user;
    const { first_name, last_name, address } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ message: "First name and last name are required." });
    }

    try {
        const query = `
            UPDATE Users 
            SET first_name = ?, last_name = ?, address = ?
            WHERE user_id = ?
        `;
        await pool.query(query, [first_name, last_name, address, userId]);

        console.log(`User profile updated: ${userId}`);
        res.json({ message: "Profile updated successfully!" });

    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ message: "Server error updating profile." });
    }
});

/* * NEW: GET ALL PRODUCT CATEGORIES */
app.get("/api/categories", async (req, res) => {
    try {
        const query = "SELECT DISTINCT category FROM Products WHERE category IS NOT NULL ORDER BY category ASC";
        const [rows] = await pool.query(query);
        const categories = rows.map(row => row.category);
        res.json(categories);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ message: "Server error fetching categories." });
    }
});

// =======================================================
// === FARMER-SPECIFIC API ENDPOINTS ===
// =======================================================

/* * 6. GET FARMER'S OWN PRODUCTS */
app.get("/api/farmer/products", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access this resource." });
    }

    try {
        const query = `SELECT p.*, COALESCE(SUM(oi.quantity), 0) as total_sold FROM Products p LEFT JOIN Order_Items oi ON p.product_id = oi.product_id WHERE p.farmer_id = ? GROUP BY p.product_id ORDER BY p.created_at DESC`;
        
        const [products] = await pool.query(query, [userId]);

        // Add full URL for images
        const productsWithFullImagePaths = products.map(product => {
            if (product.image_url) {
                return {
                    ...product,
                    image_url: `http://localhost:${PORT}/uploads/${product.image_url}`
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
        // Use price_at_purchase instead of unit_price
        const revenueQuery = `SELECT COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as totalRevenue FROM Order_Items oi JOIN Products p ON oi.product_id = p.product_id WHERE p.farmer_id = ?`;
        const [revenueResult] = await pool.query(revenueQuery, [userId]);

        // Get best selling product with revenue data
        const bestProductQuery = `
            SELECT 
                p.product_id, 
                p.product_name, 
                SUM(oi.quantity) as total_sold,
                SUM(oi.quantity * oi.price_at_purchase) as total_revenue
            FROM Order_Items oi 
            JOIN Products p ON oi.product_id = p.product_id 
            WHERE p.farmer_id = ? 
            GROUP BY p.product_id, p.product_name 
            ORDER BY total_sold DESC 
            LIMIT 1`;
        const [bestProductResult] = await pool.query(bestProductQuery, [userId]);

        // Get stock statistics
        const stockStatsQuery = `
            SELECT 
                COUNT(*) as total_products,
                SUM(CASE WHEN stock_status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_count,
                SUM(CASE WHEN stock_status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN stock_status = 'in_stock' THEN 1 ELSE 0 END) as in_stock_count
            FROM Products 
            WHERE farmer_id = ?
        `;
        const [stockStatsResult] = await pool.query(stockStatsQuery, [userId]);

        res.json({
            totalRevenue: revenueResult[0].totalRevenue || 0,
            bestProduct: bestProductResult[0] || null,
            stockStats: stockStatsResult[0] || {
                total_products: 0,
                out_of_stock_count: 0,
                low_stock_count: 0,
                in_stock_count: 0
            }
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
        // First verify the product belongs to this farmer
        const [ownershipCheck] = await pool.query("SELECT farmer_id FROM Products WHERE product_id = ?", [productId]);

        if (ownershipCheck.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (ownershipCheck[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only update your own products." });
        }

        // Build update query based on whether there's a new image
        let query, params;
        if (image_url) {
            query = `UPDATE Products SET product_name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE product_id = ?`;
            params = [product_name, description, price, category, image_url, productId];
        } else {
            query = `UPDATE Products SET product_name = ?, description = ?, price = ?, category = ? WHERE product_id = ?`;
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
        // First verify the product belongs to this farmer
        const [ownershipCheck] = await pool.query(
            "SELECT farmer_id FROM Products WHERE product_id = ?",
            [productId]
        );

        if (ownershipCheck.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (ownershipCheck[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only delete your own products." });
        }

        await pool.query("DELETE FROM Products WHERE product_id = ?", [productId]);
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
    const { quantity, action } = req.body; // action: 'add' or 'set'

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can update stock." });
    }

    if (!quantity || isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ message: "Valid non-negative quantity is required." });
    }

    try {
        // First verify the product belongs to this farmer
        const [ownershipCheck] = await pool.query(
            "SELECT farmer_id, stock_quantity FROM Products WHERE product_id = ?",
            [productId]
        );

        if (ownershipCheck.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (ownershipCheck[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only update stock for your own products." });
        }

        let newStock;
        if (action === 'add') {
            newStock = parseInt(ownershipCheck[0].stock_quantity) + parseInt(quantity);
        } else if (action === 'set') {
            newStock = parseInt(quantity);
        } else {
            return res.status(400).json({ message: "Invalid action. Use 'add' or 'set'." });
        }

        // Ensure stock doesn't go below 0 at application level
        newStock = Math.max(0, newStock);

        // Update stock quantity and status
        const stockStatus = getStockStatus(newStock);
        await pool.query(
            "UPDATE Products SET stock_quantity = ?, stock_status = ? WHERE product_id = ?",
            [newStock, stockStatus, productId]
        );

        res.json({ 
            message: "Stock updated successfully!", 
            newStock,
            stockStatus 
        });

    } catch (err) {
        console.error("Update Stock Error:", err);
        res.status(500).json({ message: "Server error updating stock." });
    }
});

/* * 11. TOGGLE PRODUCT STATUS (active/inactive) */
app.patch("/api/farmer/products/:id/status", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const productId = req.params.id;
    const { is_active } = req.body;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can update product status." });
    }

    try {
        // First verify the product belongs to this farmer
        const [ownershipCheck] = await pool.query(
            "SELECT farmer_id FROM Products WHERE product_id = ?",
            [productId]
        );

        if (ownershipCheck.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (ownershipCheck[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only update status for your own products." });
        }

        await pool.query(
            "UPDATE Products SET is_active = ? WHERE product_id = ?",
            [is_active, productId]
        );

        res.json({ message: `Product ${is_active ? 'activated' : 'deactivated'} successfully!` });

    } catch (err) {
        console.error("Toggle Product Status Error:", err);
        res.status(500).json({ message: "Server error updating product status." });
    }
});

/* * 12. GET SALES REPORT */
app.get("/api/farmer/sales-report", verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    const { range = 'month' } = req.query; // week, month, quarter, year

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access sales reports." });
    }

    try {
        let dateFilter;
        const now = new Date();

        switch (range) {
            case 'week':
                dateFilter = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                dateFilter = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'quarter':
                dateFilter = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case 'year':
                dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        }

        const query = `SELECT p.product_id, p.product_name, SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.price_at_purchase) as total_revenue FROM Order_Items oi JOIN Products p ON oi.product_id = p.product_id JOIN Orders o ON oi.order_id = o.order_id WHERE p.farmer_id = ? AND o.order_date >= ? GROUP BY p.product_id, p.product_name ORDER BY total_revenue DESC`;

        const [salesData] = await pool.query(query, [userId, dateFilter]);
        res.json(salesData);

    } catch (err) {
        console.error("Sales Report Error:", err);
        res.status(500).json({ message: "Server error fetching sales report." });
    }
});

// ... [Previous chat endpoints remain the same - keeping them for brevity]

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

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. First, check all products for availability and prevent negative stock
        for (const item of items) {
            const [productRows] = await connection.execute(
                "SELECT product_id, price, stock_quantity, stock_status FROM Products WHERE product_id = ? AND is_active = 1",
                [item.product_id]
            );

            if (productRows.length === 0) {
                throw new Error(`Product ${item.product_id} not found or inactive`);
            }

            const product = productRows[0];
            
            // Check if product is out of stock
            if (product.stock_status === 'out_of_stock') {
                throw new Error(`Product ${item.product_id} is out of stock`);
            }
            
            // Check if sufficient stock is available
            if (product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
            }
        }

        // 2. Generate custom order ID
        const orderNumber = generateOrderId();

        // 3. Create the order with custom order_number
        const orderQuery = `
            INSERT INTO Orders (user_id, order_number, total_amount, shipping_address, status) 
            VALUES (?, ?, ?, ?, 'pending')
        `;
        const [orderResult] = await connection.execute(orderQuery, [
            userId, 
            orderNumber,
            total_amount, 
            shipping_address.trim()
        ]);
        
        const orderId = orderResult.insertId;

        // 4. Add order items and update product stock
        for (const item of items) {
            // Get product price
            const [productRows] = await connection.execute(
                "SELECT price, stock_quantity FROM Products WHERE product_id = ?",
                [item.product_id]
            );
            const product = productRows[0];

            // Add order item
            const orderItemQuery = `
                INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase) 
                VALUES (?, ?, ?, ?)
            `;
            await connection.execute(orderItemQuery, [
                orderId,
                item.product_id,
                item.quantity,
                product.price
            ]);

            // Update product stock - ensure it doesn't go below 0
            const newStock = Math.max(0, product.stock_quantity - item.quantity);
            
            // Update stock quantity and status
            const stockStatus = getStockStatus(newStock);
            const updateStockQuery = `
                UPDATE Products 
                SET stock_quantity = ?, stock_status = ?
                WHERE product_id = ?
            `;
            await connection.execute(updateStockQuery, [newStock, stockStatus, item.product_id]);
        }

        await connection.commit();

        res.status(201).json({
            message: "Order placed successfully!",
            orderId: orderId,
            orderNumber: orderNumber,
            totalAmount: total_amount
        });

    } catch (err) {
        await connection.rollback();
        console.error("Create Order Error:", err);
        
        if (err.message.includes('Insufficient stock') || err.message.includes('out of stock') || err.message.includes('not found')) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(500).json({ message: "Server error creating order." });
        }
    } finally {
        connection.release();
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
            SELECT 
                o.order_id,
                o.order_number,
                o.total_amount,
                o.shipping_address,
                o.status,
                o.order_date,
                oi.order_item_id,
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase as price,
                p.product_name,
                p.image_url,
                u.first_name as farmer_first_name,
                u.last_name as farmer_last_name
            FROM Orders o
            LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
            LEFT JOIN Products p ON oi.product_id = p.product_id
            LEFT JOIN Users u ON p.farmer_id = u.user_id
            WHERE o.user_id = ?
            ORDER BY o.order_date DESC
        `;

        const [rows] = await pool.query(ordersQuery, [userId]);

        const ordersMap = new Map();
        
        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    order_id: row.order_id,
                    order_number: row.order_number,
                    total_amount: row.total_amount,
                    shipping_address: row.shipping_address,
                    status: row.status,
                    order_date: row.order_date,
                    items: []
                });
            }
            
            if (row.order_item_id) {
                ordersMap.get(row.order_id).items.push({
                    order_item_id: row.order_item_id,
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price: row.price,
                    image_url: row.image_url,
                    farmer_name: `${row.farmer_first_name || ''} ${row.farmer_last_name || ''}`.trim()
                });
            }
        });

        const orders = Array.from(ordersMap.values());
        res.json(orders);

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
            SELECT 
                p.product_id, 
                p.product_name, 
                p.description, 
                p.price, 
                p.stock_quantity, 
                p.stock_status,
                p.category, 
                p.image_url,
                u.first_name,
                u.last_name
            FROM Products p 
            JOIN Users u ON p.farmer_id = u.user_id 
            WHERE p.stock_quantity > 0 AND p.is_active = 1 AND p.stock_status != 'out_of_stock'
            ORDER BY RAND() 
            LIMIT ?
        `;
        
        const [rows] = await pool.query(query, [parseInt(limit)]);

        const productsWithFullImagePaths = rows.map(product => {
            if (product.image_url && !product.image_url.startsWith('http')) {
                return {
                    ...product,
                    image_url: `http://localhost:${PORT}/uploads/${product.image_url}`
                };
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
            SELECT 
                o.order_id,
                o.order_number,
                o.total_amount,
                o.shipping_address,
                o.status,
                o.order_date,
                oi.order_item_id,
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase as price,
                p.product_name,
                p.image_url,
                u.first_name as customer_first_name,
                u.last_name as customer_last_name,
                u.email as customer_email
            FROM Orders o
            JOIN Order_Items oi ON o.order_id = oi.order_id
            JOIN Products p ON oi.product_id = p.product_id
            JOIN Users u ON o.user_id = u.user_id
            WHERE p.farmer_id = ?
            ORDER BY o.order_date DESC
        `;

        const [rows] = await pool.query(query, [userId]);

        const ordersMap = new Map();
        
        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    order_id: row.order_id,
                    order_number: row.order_number,
                    total_amount: row.total_amount,
                    shipping_address: row.shipping_address,
                    status: row.status,
                    order_date: row.order_date,
                    customer_name: `${row.customer_first_name} ${row.customer_last_name}`,
                    customer_email: row.customer_email,
                    items: []
                });
            }
            
            ordersMap.get(row.order_id).items.push({
                order_item_id: row.order_item_id,
                product_id: row.product_id,
                product_name: row.product_name,
                quantity: row.quantity,
                price: row.price,
                image_url: row.image_url
            });
        });

        const orders = Array.from(ordersMap.values());
        res.json(orders);

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
        // Verify the farmer owns products in this order
        const verifyQuery = `
            SELECT COUNT(*) as product_count 
            FROM Order_Items oi 
            JOIN Products p ON oi.product_id = p.product_id 
            WHERE oi.order_id = ? AND p.farmer_id = ?
        `;
        const [verifyResult] = await pool.query(verifyQuery, [orderId, userId]);

        if (verifyResult[0].product_count === 0) {
            return res.status(403).json({ message: "You can only update orders containing your products." });
        }

        // Update order status
        await pool.query(
            "UPDATE Orders SET status = ?, updated_at = NOW() WHERE order_id = ?",
            [status, orderId]
        );

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
            case 'week':
                dateFilter = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                dateFilter = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'quarter':
                dateFilter = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case 'year':
                dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        }

        // Sales data with product details
        const salesQuery = `
            SELECT 
                p.product_id,
                p.product_name,
                p.category,
                p.stock_status,
                SUM(oi.quantity) as total_sold,
                SUM(oi.quantity * oi.price_at_purchase) as total_revenue,
                AVG(oi.price_at_purchase) as avg_price,
                COUNT(DISTINCT o.order_id) as order_count
            FROM Order_Items oi
            JOIN Products p ON oi.product_id = p.product_id
            JOIN Orders o ON oi.order_id = o.order_id
            WHERE p.farmer_id = ? AND o.order_date >= ?
            GROUP BY p.product_id, p.product_name, p.category, p.stock_status
            ORDER BY total_revenue DESC
        `;

        const [salesData] = await pool.query(salesQuery, [userId, dateFilter]);

        // Customer statistics - FIXED: This was missing!
        const customerQuery = `
            SELECT 
                COUNT(DISTINCT o.user_id) as total_customers,
                COUNT(DISTINCT o.order_id) as total_orders,
                AVG(o.total_amount) as avg_order_value
            FROM Orders o
            JOIN Order_Items oi ON o.order_id = oi.order_id
            JOIN Products p ON oi.product_id = p.product_id
            WHERE p.farmer_id = ? AND o.order_date >= ?
        `;

        const [customerStats] = await pool.query(customerQuery, [userId, dateFilter]);

        // Stock analytics
        const stockAnalyticsQuery = `
            SELECT 
                stock_status,
                COUNT(*) as product_count,
                SUM(stock_quantity) as total_quantity
            FROM Products 
            WHERE farmer_id = ?
            GROUP BY stock_status
        `;

        const [stockAnalytics] = await pool.query(stockAnalyticsQuery, [userId]);

        // Calculate summary
        const totalRevenue = salesData.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
        const totalItemsSold = salesData.reduce((sum, item) => sum + parseInt(item.total_sold || 0), 0);
        const topProduct = salesData[0] || null;

        res.json({
            period,
            salesData,
            stockAnalytics,
            customerStats: customerStats[0] || { // FIXED: Added customerStats
                total_customers: 0,
                total_orders: 0,
                avg_order_value: 0
            },
            summary: {
                totalRevenue,
                totalItemsSold,
                topProduct
            }
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
        let query;
        let params = [];

        if (role === 'farmer') {
            query = "SELECT * FROM ProductSalesSummary WHERE farmer_id = ? ORDER BY total_revenue DESC";
            params = [userId];
        } else if (role === 'customer') {
            query = "SELECT * FROM ProductSalesSummary WHERE stock_status != 'out_of_stock' ORDER BY total_sold DESC LIMIT 50";
        } else {
            return res.status(403).json({ message: "Access denied" });
        }

        const [results] = await pool.query(query, params);

        // Add full image URLs
        const productsWithImages = results.map(product => ({
            ...product,
            image_url: product.image_url ? `http://localhost:${PORT}/uploads/${product.image_url}` : null
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
        const query = "SELECT * FROM FarmerPerformance WHERE farmer_id = ?";
        const [results] = await pool.query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({ message: "Performance data not found" });
        }

        res.json(results[0]);
    } catch (err) {
        console.error("Farmer Performance Error:", err);
        res.status(500).json({ message: "Error fetching farmer performance" });
    }
});

/* * 29. SYNC ALL STOCK STATUS USING CURSOR */
app.post("/api/admin/update-stock-status", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    // Only allow farmers to update their own products
    if (role !== 'farmer') {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        // Use the cursor-based stored procedure
        await pool.query('CALL UpdateAllProductStockStatus()');
        
        res.json({ 
            message: "All product stock status updated successfully using cursor",
            method: "cursor_procedure"
        });
    } catch (err) {
        console.error("Update Stock Status Error:", err);
        res.status(500).json({ message: "Error updating stock status" });
    }
});

/* * 30. GET PRODUCT SALES SUMMARY USING VIEW */
app.get("/api/analytics/product-sales", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    try {
        let query;
        let params = [];

        if (role === 'farmer') {
            query = "SELECT * FROM ProductSalesSummary WHERE farmer_id = ? ORDER BY total_revenue DESC";
            params = [userId];
        } else {
            return res.status(403).json({ message: "Access denied" });
        }

        const [results] = await pool.query(query, params);

        // Add full image URLs
        const productsWithImages = results.map(product => ({
            ...product,
            image_url: product.image_url ? `http://localhost:${PORT}/uploads/${product.image_url}` : null
        }));

        res.json({
            data: productsWithImages,
            summary: {
                totalProducts: results.length,
                totalRevenue: results.reduce((sum, p) => sum + parseFloat(p.total_revenue), 0),
                totalItemsSold: results.reduce((sum, p) => sum + parseInt(p.total_sold), 0),
                source: "database_view"
            }
        });
    } catch (err) {
        console.error("Product Sales Summary Error:", err);
        res.status(500).json({ message: "Error fetching product sales summary" });
    }
});

/* * 31. GET FARMER PERFORMANCE USING VIEW */
app.get("/api/analytics/farmer-performance", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Only farmers can access performance data" });
    }

    try {
        const query = "SELECT * FROM FarmerPerformance WHERE farmer_id = ?";
        const [results] = await pool.query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({ message: "Performance data not found" });
        }

        res.json({
            ...results[0],
            source: "database_view"
        });
    } catch (err) {
        console.error("Farmer Performance Error:", err);
        res.status(500).json({ message: "Error fetching farmer performance" });
    }
});

/* * 32. GET ENHANCED ANALYTICS WITH VIEWS */
app.get("/api/analytics/enhanced", verifyToken, async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'farmer') {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        // Get data from both views
        const [performanceData] = await pool.query(
            "SELECT * FROM FarmerPerformance WHERE farmer_id = ?", 
            [userId]
        );

        const [salesData] = await pool.query(
            "SELECT * FROM ProductSalesSummary WHERE farmer_id = ? ORDER BY total_revenue DESC LIMIT 10",
            [userId]
        );

        res.json({
            performance: performanceData[0] || {},
            topProducts: salesData,
            analyticsSource: "database_views",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Enhanced Analytics Error:", err);
        res.status(500).json({ message: "Error fetching enhanced analytics" });
    }
});

// ===================================
// === CHATBOT API ENDPOINTS ===
// ===================================

/* * SEND A CHAT MESSAGE */
app.post("/api/chat/send", verifyToken, async (req, res) => {
    const { userId } = req.user;
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Message cannot be empty." });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Save user's message to the database
        const userMessageQuery = `INSERT INTO ChatHistory (user_id, role, text) VALUES (?, 'user', ?)`;
        await connection.execute(userMessageQuery, [userId, message.trim()]);

        // 2. Get a response from the AI model (using Groq)
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant for farmers named Krushi Sathi. Provide concise, practical advice on agriculture, crops, weather, and government schemes in India.'
                },
                {
                    role: 'user',
                    content: message.trim(),
                },
            ],
            model: 'llama-3.1-8b-instant', // Or another model you prefer
        });

        const aiResponseText = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that request.";

        // 3. Save AI's response to the database
        const aiMessageQuery = `INSERT INTO ChatHistory (user_id, role, text) VALUES (?, 'model', ?)`;
        const [aiResult] = await connection.execute(aiMessageQuery, [userId, aiResponseText]);

        await connection.commit();

        // 4. Send the AI response back to the front-end
        res.status(200).json({
            response: aiResponseText,
            timestamp: new Date().toISOString(),
            message_id: aiResult.insertId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Chat API Error:', error);
        res.status(500).json({ message: "Failed to get a response from the assistant." });
    } finally {
        connection.release();
    }
});


/* * GET CHAT HISTORY */
app.get("/api/chat/history", verifyToken, async (req, res) => {
    const { userId } = req.user;
    try {
        const query = `
            SELECT message_id, role, text, timestamp
            FROM ChatHistory
            WHERE user_id = ?
            ORDER BY timestamp ASC
        `;
        const [history] = await pool.query(query, [userId]);
        res.json(history);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: "Failed to load chat history." });
    }
});


/* * DELETE CHAT HISTORY */
app.delete("/api/chat/history", verifyToken, async (req, res) => {
    const { userId } = req.user;
    try {
        const query = `DELETE FROM ChatHistory WHERE user_id = ?`;
        await pool.query(query, [userId]);
        res.status(200).json({ message: "Chat history cleared successfully." });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ message: "Failed to clear chat history." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});