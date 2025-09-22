// === IMPORTS ===
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require('multer'); // For handling file uploads
const path = require('path');     // For handling file paths
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import Gemini AI library

// === CONFIGURATION ===
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

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

        const query = `
            INSERT INTO Users 
                (username, email, password_hash, user_type, first_name, last_name, address) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

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

/* * 3A. GET ALL PRODUCTS */
app.get("/api/products", async (req, res) => {
    try {
        const query = `
            SELECT p.product_id, p.product_name, p.description, p.price, p.stock_quantity, p.category, p.image_url, p.created_at, u.username AS farmer_name 
            FROM Products p
            JOIN Users u ON p.farmer_id = u.user_id
            WHERE p.stock_quantity > 0;
        `;
        const [rows] = await pool.query(query);

        const productsWithFullImagePaths = rows.map(product => {
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

    try {
        const query = `
            INSERT INTO Products 
                (product_name, description, price, stock_quantity, farmer_id, category, image_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await pool.query(query, [
            product_name,
            description,
            price,
            stock_quantity,
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
        // This query selects all unique, non-null category names from your Products table
        const query = "SELECT DISTINCT category FROM Products WHERE category IS NOT NULL ORDER BY category ASC";
        const [rows] = await pool.query(query);

        // The result is an array of objects: [{ category: 'Fruit' }, { category: 'Vegetable' }]
        // We map it to a simple array of strings for easier use on the frontend: ['Fruit', 'Vegetable']
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
        const query = `
            SELECT p.*, 
                   COALESCE(SUM(oi.quantity), 0) as total_sold,
                   p.is_active
            FROM Products p
            LEFT JOIN Order_Items oi ON p.product_id = oi.product_id
            WHERE p.farmer_id = ?
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
        `;
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
        // Get total revenue
        const revenueQuery = `
            SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) as totalRevenue
            FROM Order_Items oi
            JOIN Products p ON oi.product_id = p.product_id
            WHERE p.farmer_id = ?
        `;
        const [revenueResult] = await pool.query(revenueQuery, [userId]);

        // Get best selling product
        const bestProductQuery = `
            SELECT p.product_id, p.product_name, SUM(oi.quantity) as total_sold
            FROM Order_Items oi
            JOIN Products p ON oi.product_id = p.product_id
            WHERE p.farmer_id = ?
            GROUP BY p.product_id, p.product_name
            ORDER BY total_sold DESC
            LIMIT 1
        `;
        const [bestProductResult] = await pool.query(bestProductQuery, [userId]);

        res.json({
            totalRevenue: revenueResult[0].totalRevenue,
            bestProduct: bestProductResult[0] || null
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
        const [ownershipCheck] = await pool.query(
            "SELECT farmer_id FROM Products WHERE product_id = ?",
            [productId]
        );

        if (ownershipCheck.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (ownershipCheck[0].farmer_id !== userId) {
            return res.status(403).json({ message: "You can only update your own products." });
        }

        // Build update query based on whether there's a new image
        let query, params;
        if (image_url) {
            query = `
                UPDATE Products 
                SET product_name = ?, description = ?, price = ?, category = ?, image_url = ?
                WHERE product_id = ?
            `;
            params = [product_name, description, price, category, image_url, productId];
        } else {
            query = `
                UPDATE Products 
                SET product_name = ?, description = ?, price = ?, category = ?
                WHERE product_id = ?
            `;
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

    if (!quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Valid quantity is required." });
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

        await pool.query(
            "UPDATE Products SET stock_quantity = ? WHERE product_id = ?",
            [newStock, productId]
        );

        res.json({ message: "Stock updated successfully!", newStock });

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

        const query = `
            SELECT 
                p.product_id,
                p.product_name,
                SUM(oi.quantity) as units_sold,
                SUM(oi.quantity * oi.unit_price) as total_revenue
            FROM Order_Items oi
            JOIN Products p ON oi.product_id = p.product_id
            JOIN Orders o ON oi.order_id = o.order_id
            WHERE p.farmer_id = ? AND o.order_date >= ?
            GROUP BY p.product_id, p.product_name
            ORDER BY total_revenue DESC
        `;

        const [salesData] = await pool.query(query, [userId, dateFilter]);
        res.json(salesData);

    } catch (err) {
        console.error("Sales Report Error:", err);
        res.status(500).json({ message: "Server error fetching sales report." });
    }
});
// === GEMINI AI CHAT BOT ENDPOINTS ===

console.log("🔑 Key being used by the app:", process.env.GEMINI_API_KEY);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
/* * 13. SEND MESSAGE TO GEMINI AI AND SAVE CHAT HISTORY (CORRECTED) */
app.post("/api/chat/send", verifyToken, async (req, res) => {
    const { userId } = req.user;
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Message cannot be empty." });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: "AI service is not configured." });
    }

    try {
        // --- FIX START ---
        // 1. Get recent chat history for context BEFORE saving the new message.
        const getHistoryQuery = `
            SELECT role, text 
            FROM Chat_History 
            WHERE user_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 10
        `;
        const [historyRows] = await pool.query(getHistoryQuery, [userId]);
        const history = historyRows.reverse(); // Order from oldest to newest

        // 2. Save the new user message to the database AFTER getting history.
        const saveUserMessageQuery = `
            INSERT INTO Chat_History (user_id, role, text) 
            VALUES (?, 'user', ?)
        `;
        await pool.query(saveUserMessageQuery, [userId, message.trim()]);
        // --- FIX END ---

        // 3. Prepare conversation history for Gemini
        const conversationHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // 4. Initialize Gemini model and start chat with the (now correct) history
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat({
            history: conversationHistory,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        // 5. Send the new message to Gemini
        const result = await chat.sendMessage(message.trim());
        const response = await result.response;
        const responseText = response.text();

        // 6. Save AI response to the database
        const saveAiMessageQuery = `
            INSERT INTO Chat_History (user_id, role, text) 
            VALUES (?, 'model', ?)
        `;
        await pool.query(saveAiMessageQuery, [userId, responseText]);

        res.json({
            success: true,
            response: responseText,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("Chat Error:", err);
        
        if (err.message.includes('API_KEY') || err.message.includes('key')) {
            return res.status(500).json({ 
                message: "AI service configuration error. Please contact administrator." 
            });
        }
        
        res.status(500).json({ 
            message: "Sorry, I'm having trouble responding right now. Please try again." 
        });
    }
});

/* * 14. GET CHAT HISTORY */
app.get("/api/chat/history", verifyToken, async (req, res) => {
    const { userId } = req.user;

    try {
    const query = "SELECT message_id, role, text, timestamp FROM Chat_History WHERE user_id = ? ORDER BY timestamp ASC";
    
    const [messages] = await pool.query(query, [userId]);
        res.json(messages);
    } catch (err) {
        console.error("Get Chat History Error:", err);
        res.status(500).json({ message: "Error fetching chat history." });
    }
});

/* * 15. CLEAR CHAT HISTORY */
app.delete("/api/chat/history", verifyToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const query = "DELETE FROM Chat_History WHERE user_id = ?";
        await pool.query(query, [userId]);

        res.json({ message: "Chat history cleared successfully!" });
    } catch (err) {
        console.error("Clear Chat History Error:", err);
        res.status(500).json({ message: "Error clearing chat history." });
    }
});


app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});