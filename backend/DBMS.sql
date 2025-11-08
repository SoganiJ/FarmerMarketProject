BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE chat_history CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE order_items CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE orders CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE products CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE users CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

-- Create Users table
CREATE TABLE users (
    user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    phone_number VARCHAR2(20),
    address CLOB,
    user_type VARCHAR2(10) NOT NULL CHECK (user_type IN ('customer','farmer')),
    profile_picture VARCHAR2(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Products table
CREATE TABLE products (
    product_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farmer_id NUMBER NOT NULL,
    product_name VARCHAR2(255) NOT NULL,
    name VARCHAR2(255) NOT NULL,
    description CLOB,
    price NUMBER(10,2) NOT NULL,
    stock_quantity NUMBER DEFAULT 0,
    stock_status VARCHAR2(20) DEFAULT 'in_stock',
    category VARCHAR2(100),
    image_url VARCHAR2(500),
    is_active NUMBER(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create Orders table
CREATE TABLE orders (
    order_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number VARCHAR2(50) UNIQUE,
    user_id NUMBER NOT NULL,
    total_amount NUMBER(10,2) NOT NULL,
    shipping_address CLOB NOT NULL,
    status VARCHAR2(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create Order_Items table
CREATE TABLE order_items (
    order_item_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id NUMBER NOT NULL,
    product_id NUMBER NOT NULL,
    quantity NUMBER NOT NULL,
    price_at_purchase NUMBER(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Create Chat_History table
CREATE TABLE chat_history (
    message_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL,
    role VARCHAR2(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    text CLOB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_products_farmer_id ON products(farmer_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- CURSOR

CREATE OR REPLACE PROCEDURE UpdateAllProductStockStatus_Cursor
AS
    CURSOR product_cursor IS 
        SELECT product_id, stock_quantity FROM products;
    
    v_product_id products.product_id%TYPE;
    v_stock_quantity products.stock_quantity%TYPE;
    v_new_status products.stock_status%TYPE;
BEGIN
    OPEN product_cursor;
    
    LOOP
        FETCH product_cursor INTO v_product_id, v_stock_quantity;
        EXIT WHEN product_cursor%NOTFOUND;
        
        -- Business logic for each row
        IF v_stock_quantity <= 0 THEN
            v_new_status := 'out_of_stock';
        ELSIF v_stock_quantity <= 10 THEN
            v_new_status := 'low_stock';
        ELSE
            v_new_status := 'in_stock';
        END IF;
        
        -- Update each product individually
        UPDATE products 
        SET stock_status = v_new_status
        WHERE product_id = v_product_id;
    END LOOP;
    
    CLOSE product_cursor;
    COMMIT;
END UpdateAllProductStockStatus_Cursor;
/

-- Trigger for updating stock after order item insertion
CREATE OR REPLACE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity - :NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = :NEW.product_id;
    
    -- Update stock status
    UPDATE products 
    SET stock_status = 
        CASE 
            WHEN stock_quantity <= 0 THEN 'out_of_stock'
            WHEN stock_quantity <= 10 THEN 'low_stock'
            ELSE 'in_stock'
        END
    WHERE product_id = :NEW.product_id;
END;
/

-- Trigger for restoring stock after order cancellation
CREATE OR REPLACE TRIGGER after_order_cancelled
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF :OLD.status != 'cancelled' AND :NEW.status = 'cancelled' THEN
        UPDATE products p
        SET stock_quantity = stock_quantity + (
            SELECT oi.quantity 
            FROM order_items oi 
            WHERE oi.order_id = :NEW.order_id 
            AND oi.product_id = p.product_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE p.product_id IN (
            SELECT product_id 
            FROM order_items 
            WHERE order_id = :NEW.order_id
        );
        
        -- Update stock status for affected products
        UPDATE products 
        SET stock_status = 
            CASE 
                WHEN stock_quantity <= 0 THEN 'out_of_stock'
                WHEN stock_quantity <= 10 THEN 'low_stock'
                ELSE 'in_stock'
            END
        WHERE product_id IN (
            SELECT product_id 
            FROM order_items 
            WHERE order_id = :NEW.order_id
        );
    END IF;
END;
/

-- Trigger for updating product updated_at timestamp
CREATE OR REPLACE TRIGGER update_product_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for updating user updated_at timestamp
CREATE OR REPLACE TRIGGER update_user_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for updating order updated_at timestamp
CREATE OR REPLACE TRIGGER update_order_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Stored procedure for detailed sales reports
CREATE OR REPLACE PROCEDURE GetFarmerSalesReport(
    p_farmer_id IN NUMBER,
    p_start_date IN DATE,
    p_end_date IN DATE,
    p_total_orders OUT NUMBER,
    p_total_items_sold OUT NUMBER,
    p_total_revenue OUT NUMBER,
    p_avg_order_value OUT NUMBER
)
AS
BEGIN
    -- Total sales summary
    SELECT 
        COUNT(DISTINCT o.order_id),
        SUM(oi.quantity),
        SUM(oi.quantity * oi.price_at_purchase),
        AVG(oi.quantity * oi.price_at_purchase)
    INTO 
        p_total_orders,
        p_total_items_sold,
        p_total_revenue,
        p_avg_order_value
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    JOIN orders o ON oi.order_id = o.order_id
    WHERE p.farmer_id = p_farmer_id 
        AND o.order_date BETWEEN p_start_date AND p_end_date;
        
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_total_orders := 0;
        p_total_items_sold := 0;
        p_total_revenue := 0;
        p_avg_order_value := 0;
    WHEN OTHERS THEN
        RAISE;
END GetFarmerSalesReport;
/

-- Procedure to update all product stock status
CREATE OR REPLACE PROCEDURE UpdateAllProductStockStatus
AS
BEGIN
    UPDATE products 
    SET stock_status = 
        CASE 
            WHEN stock_quantity <= 0 THEN 'out_of_stock'
            WHEN stock_quantity <= 10 THEN 'low_stock'
            ELSE 'in_stock'
        END,
        updated_at = CURRENT_TIMESTAMP;
    
    COMMIT;
END UpdateAllProductStockStatus;
/

-- Function to get product sales summary
CREATE OR REPLACE FUNCTION GetProductSalesSummary(p_product_id IN NUMBER)
RETURN SYS_REFCURSOR
AS
    product_cursor SYS_REFCURSOR;
BEGIN
    OPEN product_cursor FOR
    SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.price AS current_price,
        p.stock_quantity,
        p.stock_status,
        p.category,
        p.image_url,
        p.is_active,
        p.created_at,
        u.user_id AS farmer_id,
        u.first_name || ' ' || u.last_name AS farmer_name,
        COALESCE(SUM(oi.quantity), 0) AS total_sold,
        COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total_revenue,
        COALESCE(AVG(oi.price_at_purchase), p.price) AS avg_sale_price,
        COUNT(DISTINCT oi.order_id) AS total_orders,
        MAX(o.order_date) AS last_sale_date
    FROM products p
    JOIN users u ON p.farmer_id = u.user_id
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id
    WHERE p.product_id = p_product_id
    GROUP BY 
        p.product_id, p.product_name, p.description, p.price, p.stock_quantity, 
        p.stock_status, p.category, p.image_url, p.is_active, p.created_at, 
        u.user_id, u.first_name, u.last_name;
    
    RETURN product_cursor;
END GetProductSalesSummary;
/

-- View 1: Product Sales Summary
CREATE OR REPLACE VIEW product_sales_summary AS
SELECT 
    p.product_id,
    p.product_name,
    p.description,
    p.price AS current_price,
    p.stock_quantity,
    p.stock_status,
    p.category,
    p.image_url,
    p.is_active,
    p.created_at,
    u.user_id AS farmer_id,
    u.first_name || ' ' || u.last_name AS farmer_name,
    COALESCE(SUM(oi.quantity), 0) AS total_sold,
    COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total_revenue,
    COALESCE(AVG(oi.price_at_purchase), p.price) AS avg_sale_price,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    MAX(o.order_date) AS last_sale_date
FROM products p
JOIN users u ON p.farmer_id = u.user_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id
WHERE p.is_active = 1
GROUP BY 
    p.product_id, p.product_name, p.description, p.price, p.stock_quantity, 
    p.stock_status, p.category, p.image_url, p.is_active, p.created_at, 
    u.user_id, u.first_name, u.last_name;

-- View 2: Farmer Performance
CREATE OR REPLACE VIEW farmer_performance AS
SELECT 
    u.user_id AS farmer_id,
    u.first_name || ' ' || u.last_name AS farmer_name,
    u.email AS farmer_email,
    COUNT(DISTINCT p.product_id) AS total_products,
    SUM(CASE WHEN p.stock_status = 'in_stock' THEN 1 ELSE 0 END) AS in_stock_products,
    SUM(CASE WHEN p.stock_status = 'low_stock' THEN 1 ELSE 0 END) AS low_stock_products,
    SUM(CASE WHEN p.stock_status = 'out_of_stock' THEN 1 ELSE 0 END) AS out_of_stock_products,
    COALESCE(SUM(oi.quantity), 0) AS total_items_sold,
    COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS total_revenue,
    COALESCE(COUNT(DISTINCT o.order_id), 0) AS total_orders,
    COALESCE(AVG(oi.quantity * oi.price_at_purchase), 0) AS avg_order_value
FROM users u
LEFT JOIN products p ON u.user_id = p.farmer_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id
WHERE u.user_type = 'farmer'
GROUP BY u.user_id, u.first_name, u.last_name, u.email;



CREATE OR REPLACE PACKAGE agriculture_validation_pkg IS
    
    -- Constants matching Node.js backend
    LOW_STOCK_THRESHOLD CONSTANT NUMBER := 10;
    
    -- Order ID Generation (matching Node.js format)
    FUNCTION generate_order_id RETURN VARCHAR2;
    
    -- Stock Management Functions
    FUNCTION get_stock_status(p_stock_quantity NUMBER) RETURN VARCHAR2;
    PROCEDURE update_product_stock_status(p_product_id NUMBER);
    PROCEDURE update_all_product_stock_status;
    
    -- User Registration Validation
    PROCEDURE validate_user_registration(
        p_username IN VARCHAR2,
        p_email IN VARCHAR2,
        p_password IN VARCHAR2,
        p_user_type IN VARCHAR2,
        p_first_name IN VARCHAR2,
        p_last_name IN VARCHAR2,
        p_is_valid OUT BOOLEAN,
        p_error_message OUT VARCHAR2
    );
    
    -- Product Validation
    PROCEDURE validate_product(
        p_product_name IN VARCHAR2,
        p_description IN VARCHAR2,
        p_price IN VARCHAR2,
        p_stock_quantity IN NUMBER,
        p_category IN VARCHAR2,
        p_is_valid OUT BOOLEAN,
        p_error_message OUT VARCHAR2
    );
    
    -- Order Validation
    PROCEDURE validate_order(
        p_items_count IN NUMBER,
        p_total_amount IN NUMBER,
        p_shipping_address IN VARCHAR2,
        p_user_role IN VARCHAR2,
        p_is_valid OUT BOOLEAN,
        p_error_message OUT VARCHAR2
    );
    
    -- Stock Update Validation
    PROCEDURE validate_stock_update(
        p_quantity IN NUMBER,
        p_action IN VARCHAR2,
        p_is_valid OUT BOOLEAN,
        p_error_message OUT VARCHAR2
    );
    
    -- Data Normalization Functions
    FUNCTION normalize_email(p_email VARCHAR2) RETURN VARCHAR2;
    FUNCTION normalize_phone(p_phone VARCHAR2) RETURN VARCHAR2;
    FUNCTION normalize_price(p_price VARCHAR2) RETURN NUMBER;
    FUNCTION normalize_name(p_name VARCHAR2) RETURN VARCHAR2;
    FUNCTION normalize_text(p_text VARCHAR2) RETURN VARCHAR2;
    
    -- Business Rule Validation
    FUNCTION is_valid_user_type(p_user_type VARCHAR2) RETURN BOOLEAN;
    FUNCTION is_valid_order_status(p_status VARCHAR2) RETURN BOOLEAN;
    FUNCTION is_valid_stock_status(p_status VARCHAR2) RETURN BOOLEAN;
    
    -- Bulk Validation Procedures
    PROCEDURE validate_products_batch(
        p_products IN SYS_REFCURSOR,
        p_valid_count OUT NUMBER,
        p_invalid_count OUT NUMBER
    );
    
    -- Audit Logging
    PROCEDURE log_validation_error(
        p_entity_type IN VARCHAR2,
        p_entity_id IN NUMBER,
        p_error_message IN VARCHAR2,
        p_user_id IN NUMBER DEFAULT NULL
    );

END agriculture_validation_pkg;
/

CREATE OR REPLACE PACKAGE BODY agriculture_validation_pkg IS

    -- =======================================================
    -- ORDER ID GENERATION (Matches Node.js format: ORD-YYMMDD-RANDOM6)
    -- =======================================================
    FUNCTION generate_order_id RETURN VARCHAR2 IS
        v_date_part VARCHAR2(6);
        v_random_part VARCHAR2(6);
    BEGIN
        -- Get date in YYMMDD format (matches Node.js: date.toISOString().slice(2,10).replace(/-/g,''))
        v_date_part := TO_CHAR(SYSDATE, 'YYMMDD');
        
        -- Generate 6-character random string (matches Node.js: Math.random().toString(36).substring(2,8))
        v_random_part := DBMS_RANDOM.STRING('X', 6);
        
        RETURN 'ORD-' || v_date_part || '-' || v_random_part;
    END generate_order_id;

    -- =======================================================
    -- STOCK MANAGEMENT FUNCTIONS
    -- =======================================================
    FUNCTION get_stock_status(p_stock_quantity NUMBER) RETURN VARCHAR2 IS
    BEGIN
        -- Exact implementation matching Node.js logic
        IF p_stock_quantity <= 0 THEN
            RETURN 'out_of_stock';
        ELSIF p_stock_quantity <= LOW_STOCK_THRESHOLD THEN
            RETURN 'low_stock';
        ELSE
            RETURN 'in_stock';
        END IF;
    END get_stock_status;

    PROCEDURE update_product_stock_status(p_product_id NUMBER) IS
        v_stock_quantity NUMBER;
        v_stock_status VARCHAR2(20);
    BEGIN
        -- Get current stock quantity
        SELECT stock_quantity INTO v_stock_quantity
        FROM products 
        WHERE product_id = p_product_id;
        
        -- Ensure non-negative quantity (matching Node.js Math.max(0, stock_quantity))
        v_stock_quantity := GREATEST(0, v_stock_quantity);
        
        -- Determine stock status
        v_stock_status := get_stock_status(v_stock_quantity);
        
        -- Update product with normalized stock data
        UPDATE products 
        SET stock_status = v_stock_status,
            stock_quantity = v_stock_quantity,
            last_updated = SYSDATE
        WHERE product_id = p_product_id;
        
        COMMIT;
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20001, 'Product not found: ' || p_product_id);
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END update_product_stock_status;

    PROCEDURE update_all_product_stock_status IS
        CURSOR product_cur IS 
            SELECT product_id, stock_quantity 
            FROM products;
    BEGIN
        FOR product_rec IN product_cur LOOP
            update_product_stock_status(product_rec.product_id);
        END LOOP;
        
        COMMIT;
    END update_all_product_stock_status;

    -- =======================================================
    -- USER REGISTRATION VALIDATION
    -- =======================================================
    PROCEDURE validate_user_registration(
        p_username IN VARCHAR2,
        p_email IN VARCHAR2,
        p_password IN VARCHAR2,
        p_user_type IN VARCHAR2,
        p_first_name IN VARCHAR2,
        p_last_name IN VARCHAR2,
        p_is_valid OUT BOOLEAN,
        p_error_message OUT VARCHAR2
    ) IS
        v_user_count NUMBER;
        v_normalized_email VARCHAR2(255);
    BEGIN
        p_is_valid := TRUE;
        p_error_message := NULL;
        
        -- Check required fields (matching Node.js validation)
        IF p_username IS NULL OR p_email IS NULL OR p_password IS NULL OR 
           p_user_type IS NULL OR p_first_name IS NULL OR p_last_name IS NULL THEN
            p_is_valid := FALSE;
            p_error_message := 'All required fields must be filled.';
            RETURN;
        END IF;
        
        -- Normalize and validate email
        v_normalized_email := normalize_email(p_email);
        IF v_normalized_email IS NULL THEN
            p_is_valid := FALSE;
            p_error_message := 'Invalid email format.';
            RETURN;
        END IF;
        
        -- Check for existing user (matching Node.js logic)
        SELECT COUNT(*) INTO v_user_count
        FROM users 
        WHERE email = v_normalized_email OR username = p_username;
        
        IF v_user_count > 0 THEN
            p_is_valid := FALSE;
            p_error_message := 'Email or username already in use.';
            RETURN;
        END IF;
        
        -- Validate user type
        IF NOT is_valid_user_type(p_user_type) THEN
            p_is_valid := FALSE;
            p_error_message := 'Invalid user type. Must be farmer or customer.';
            RETURN;
        END IF;
        
        -- Validate name lengths
        IF LENGTH(p_first_name) < 2 OR LENGTH(p_last_name) < 2 THEN
            p_is_valid := FALSE;
            p_error_message := 'First name and last name must be at least 2 characters long.';
            RETURN;
        END IF;
        
        -- Validate password strength
        IF LENGTH(p_password) < 6 THEN
            p_is_valid := FALSE;
            p_error_message := 'Password must be at least 6 characters long.';
            RETURN;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            p_is_valid := FALSE;
            p_error_message := 'System error during validation: ' || SQLERRM;
    END validate_user_registration;

    -- =======================================================
    -- PRODUCT VALIDATION
    -- =======================================================
    PROCEDURE validate_product(
        p_product_name IN VARCHAR2,
        p_description IN VARCHAR2,
        p_price IN VARCHAR2,
        p_stock_quantity IN NUMBER,
        p_category IN VARCHAR2,
        p_is_valid OUT BOOLEAN,
        p_error_message OUT VARCHAR2
    ) IS
        v_normalized_price NUMBER;
    BEGIN
        p_is_valid := TRUE;
        p_error_message := NULL;
        
        -- Check required fields (matching Node.js validation)
        IF p_product_name IS NULL OR p_description IS NULL OR p_price IS NULL OR 
           p_stock_quantity IS NULL OR p_category IS NULL THEN
            p_is_valid := FALSE;
            p_error_message := 'All fields are required.';
            RETURN;
        END IF;
        
        -- Normalize and validate price
        BEGIN
            v_normalized_price := normalize_price(p_price);
            IF v_normalized_price <= 0 THEN
                p_is_valid := FALSE;
                p_error_message := 'Price must be greater than 0.';
                RETURN;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                p_is_valid := FALSE;
                p_error_message := 'Invalid price format.';
                RETURN;
        END;
        
        -- Validate stock quantity (non-negative)
        IF p_stock_quantity < 0 THEN
            p_is_valid := FALSE;
            p_error_message := 'Stock quantity cannot be negative.';
            RETURN;
        END IF;
        
        -- Validate product name length
        IF LENGTH(p_product_name) < 2 THEN
            p_is_valid := FALSE;
            p_error_message := 'Product name must be at least 2 characters long.';
            RETURN;
        END IF;
        
        -- Validate category
        IF LENGTH(p_category) < 2 THEN
            p_is_valid := FALSE;
            p_error_message := 'Category must be at least 2 characters long.';
            RETURN;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            p_is_valid := FALSE;
            p_error_message := 'System error during product validation: ' || SQLERRM;
    END validate_product;

    -- =======================================================
    -- ORDER VALIDATION
    -- =======================================================
    PROCEDURE validate_order(
        p_items_count IN NUMBER,
        p_total_amount IN NUMBER,
        p_shipping_address IN VARCHAR2,
        p_user_role IN VARCHAR2,
        p_is_valid OUT BOOLEAN,
        p_error_message OUT VARCHAR2
    ) IS
    BEGIN
        p_is_valid := TRUE;
        p_error_message := NULL;
        
        -- Check user role (matching Node.js: role !== 'customer')
        IF p_user_role != 'customer' THEN
            p_is_valid := FALSE;
            p_error_message := 'Only customers can place orders.';
            RETURN;
        END IF;
        
        -- Validate items (matching Node.js: !items || !Array.isArray(items) || items.length === 0)
        IF p_items_count IS NULL OR p_items_count <= 0 THEN
            p_is_valid := FALSE;
            p_error_message := 'Order must contain items.';
            RETURN;
        END IF;
        
        -- Validate total amount
        IF p_total_amount IS NULL OR p_total_amount <= 0 THEN
            p_is_valid := FALSE;
            p_error_message := 'Valid total amount is required.';
            RETURN;
        END IF;
        
        -- Validate shipping address
        IF p_shipping_address IS NULL OR TRIM(p_shipping_address) IS NULL THEN
            p_is_valid := FALSE;
            p_error_message := 'Shipping address is required.';
            RETURN;
        END IF;
        
        IF LENGTH(TRIM(p_shipping_address)) < 10 THEN
            p_is_valid := FALSE;
            p_error_message := 'Shipping address must be at least 10 characters long.';
            RETURN;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            p_is_valid := FALSE;
            p_error_message := 'System error during order validation: ' || SQLERRM;
    END validate_order;

    -- =======================================================
    -- STOCK UPDATE VALIDATION
    -- =======================================================
    PROCEDURE validate_stock_update(
        p_quantity IN NUMBER,
        p_action IN VARCHAR2,
        p_is_valid OUT BOOLEAN,
        p_error_message OUT VARCHAR2
    ) IS
    BEGIN
        p_is_valid := TRUE;
        p_error_message := NULL;
        
        -- Validate quantity (matching Node.js: !quantity || isNaN(quantity) || quantity < 0)
        IF p_quantity IS NULL OR p_quantity < 0 THEN
            p_is_valid := FALSE;
            p_error_message := 'Valid non-negative quantity is required.';
            RETURN;
        END IF;
        
        -- Validate action (matching Node.js: action must be 'add' or 'set')
        IF p_action NOT IN ('add', 'set') THEN
            p_is_valid := FALSE;
            p_error_message := 'Invalid action. Use ''add'' or ''set''.';
            RETURN;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            p_is_valid := FALSE;
            p_error_message := 'System error during stock validation: ' || SQLERRM;
    END validate_stock_update;

    -- =======================================================
    -- DATA NORMALIZATION FUNCTIONS
    -- =======================================================
    FUNCTION normalize_email(p_email VARCHAR2) RETURN VARCHAR2 IS
        v_normalized_email VARCHAR2(255);
    BEGIN
        IF p_email IS NULL THEN
            RETURN NULL;
        END IF;
        
        v_normalized_email := LOWER(TRIM(p_email));
        
        -- Basic email format validation
        IF REGEXP_LIKE(v_normalized_email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
            RETURN v_normalized_email;
        ELSE
            RETURN NULL;
        END IF;
    END normalize_email;

    FUNCTION normalize_phone(p_phone VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
        IF p_phone IS NULL THEN
            RETURN NULL;
        END IF;
        
        -- Remove all non-digit characters
        RETURN REGEXP_REPLACE(p_phone, '[^0-9]', '');
    END normalize_phone;

    FUNCTION normalize_price(p_price VARCHAR2) RETURN NUMBER IS
        v_clean_price VARCHAR2(50);
        v_normalized_price NUMBER;
    BEGIN
        IF p_price IS NULL THEN
            RETURN NULL;
        END IF;
        
        -- Remove currency symbols, commas, and extra spaces
        v_clean_price := REGEXP_REPLACE(TRIM(p_price), '[^\d.]', '');
        
        -- Convert to number with 2 decimal places
        v_normalized_price := ROUND(TO_NUMBER(v_clean_price), 2);
        
        RETURN v_normalized_price;
        
    EXCEPTION
        WHEN VALUE_ERROR OR INVALID_NUMBER THEN
            RETURN NULL;
    END normalize_price;

    FUNCTION normalize_name(p_name VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
        IF p_name IS NULL THEN
            RETURN NULL;
        END IF;
        
        -- Trim, convert to proper case, remove extra spaces
        RETURN INITCAP(REGEXP_REPLACE(TRIM(p_name), '\s+', ' '));
    END normalize_name;

    FUNCTION normalize_text(p_text VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
        IF p_text IS NULL THEN
            RETURN NULL;
        END IF;
        
        -- Trim and remove extra spaces
        RETURN REGEXP_REPLACE(TRIM(p_text), '\s+', ' ');
    END normalize_text;

    -- =======================================================
    -- BUSINESS RULE VALIDATION FUNCTIONS
    -- =======================================================
    FUNCTION is_valid_user_type(p_user_type VARCHAR2) RETURN BOOLEAN IS
    BEGIN
        RETURN p_user_type IN ('farmer', 'customer');
    END is_valid_user_type;

    FUNCTION is_valid_order_status(p_status VARCHAR2) RETURN BOOLEAN IS
    BEGIN
        RETURN p_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
    END is_valid_order_status;

    FUNCTION is_valid_stock_status(p_status VARCHAR2) RETURN BOOLEAN IS
    BEGIN
        RETURN p_status IN ('out_of_stock', 'low_stock', 'in_stock');
    END is_valid_stock_status;

    -- =======================================================
    -- BULK VALIDATION PROCEDURES
    -- =======================================================
    PROCEDURE validate_products_batch(
        p_products IN SYS_REFCURSOR,
        p_valid_count OUT NUMBER,
        p_invalid_count OUT NUMBER
    ) IS
        TYPE product_rec IS RECORD (
            product_id NUMBER,
            product_name VARCHAR2(255),
            price VARCHAR2(50),
            stock_quantity NUMBER,
            category VARCHAR2(100)
        );
        v_product product_rec;
        v_is_valid BOOLEAN;
        v_error_message VARCHAR2(4000);
    BEGIN
        p_valid_count := 0;
        p_invalid_count := 0;
        
        LOOP
            FETCH p_products INTO v_product;
            EXIT WHEN p_products%NOTFOUND;
            
            validate_product(
                v_product.product_name,
                'Description placeholder', -- Would need actual description
                v_product.price,
                v_product.stock_quantity,
                v_product.category,
                v_is_valid,
                v_error_message
            );
            
            IF v_is_valid THEN
                p_valid_count := p_valid_count + 1;
            ELSE
                p_invalid_count := p_invalid_count + 1;
                log_validation_error('PRODUCT', v_product.product_id, v_error_message);
            END IF;
        END LOOP;
        
        CLOSE p_products;
        
    EXCEPTION
        WHEN OTHERS THEN
            IF p_products%ISOPEN THEN
                CLOSE p_products;
            END IF;
            RAISE;
    END validate_products_batch;

    -- =======================================================
    -- AUDIT LOGGING
    -- =======================================================
    PROCEDURE log_validation_error(
        p_entity_type IN VARCHAR2,
        p_entity_id IN NUMBER,
        p_error_message IN VARCHAR2,
        p_user_id IN NUMBER DEFAULT NULL
    ) IS
        PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN
        INSERT INTO validation_errors_log (
            error_id, entity_type, entity_id, error_message, 
            user_id, created_at
        ) VALUES (
            validation_error_seq.NEXTVAL,
            p_entity_type,
            p_entity_id,
            SUBSTR(p_error_message, 1, 2000),
            p_user_id,
            SYSDATE
        );
        
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            -- Don't raise error from logging procedure
            NULL;
    END log_validation_error;

END agriculture_validation_pkg;
/

-- =======================================================
-- SUPPORTING DATABASE OBJECTS
-- =======================================================

-- Sequence for error logging
CREATE SEQUENCE validation_error_seq START WITH 1 INCREMENT BY 1;

-- Validation errors log table
CREATE TABLE validation_errors_log (
    error_id NUMBER PRIMARY KEY,
    entity_type VARCHAR2(50) NOT NULL,
    entity_id NUMBER,
    error_message VARCHAR2(2000) NOT NULL,
    user_id NUMBER,
    created_at DATE DEFAULT SYSDATE
);

-- Index for better query performance
CREATE INDEX idx_val_errors_entity ON validation_errors_log(entity_type, entity_id);
CREATE INDEX idx_val_errors_date ON validation_errors_log(created_at);

-- =======================================================
-- DATABASE TRIGGERS FOR AUTOMATIC NORMALIZATION
-- =======================================================

-- Trigger for automatic user data normalization
CREATE OR REPLACE TRIGGER normalize_user_data
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
BEGIN
    :NEW.email := agriculture_validation_pkg.normalize_email(:NEW.email);
    :NEW.first_name := agriculture_validation_pkg.normalize_name(:NEW.first_name);
    :NEW.last_name := agriculture_validation_pkg.normalize_name(:NEW.last_name);
    :NEW.username := LOWER(TRIM(:NEW.username));
END normalize_user_data;
/

-- Trigger for automatic product data normalization
CREATE OR REPLACE TRIGGER normalize_product_data
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
BEGIN
    :NEW.product_name := agriculture_validation_pkg.normalize_name(:NEW.product_name);
    :NEW.category := UPPER(TRIM(:NEW.category));
    :NEW.description := agriculture_validation_pkg.normalize_text(:NEW.description);
    
    -- Auto-update stock status when quantity changes
    IF UPDATING('STOCK_QUANTITY') THEN
        :NEW.stock_status := agriculture_validation_pkg.get_stock_status(:NEW.stock_quantity);
    END IF;
END normalize_product_data;
/



-- Display table information
SELECT table_name FROM user_tables WHERE table_name IN ('USERS', 'PRODUCTS', 'ORDERS', 'ORDER_ITEMS', 'CHAT_HISTORY');

-- Display success message
DBMS_OUTPUT.PUT_LINE('Farmer Market Database schema created successfully!');
/