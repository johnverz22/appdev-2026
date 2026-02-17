-- Create products table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_products_name ON products(name);

-- Seeding the table with sample data
INSERT INTO products (name, description, price, quantity) VALUES
    ('Laptop', 'High-performance laptop with 16GB RAM and 512GB SSD', 999.99, 50),
    ('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 150),
    ('Mechanical Keyboard', 'RGB mechanical keyboard with Cherry MX switches', 149.99, 75),
    ('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader', 49.99, 200),
    ('Monitor', '27-inch 4K UHD monitor with HDR support', 399.99, 30);
