-- Create databases
CREATE DATABASE php_db;
CREATE DATABASE java_db;

-- ── php_db tables ──────────────────────────────────────────────
\connect php_db

CREATE TABLE products (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(100)   NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

INSERT INTO products (name, price) VALUES
    ('Laptop',    999.99),
    ('Mouse',      19.99),
    ('Keyboard',   49.99),
    ('Monitor',   299.99),
    ('Webcam',     79.99),
    ('Headset',    59.99);

-- ── java_db tables ─────────────────────────────────────────────
\connect java_db

CREATE TABLE orders (
    id           SERIAL PRIMARY KEY,
    product_id   INTEGER        NOT NULL,   -- ID from php_db.products (no FK — different DB)
    product_name VARCHAR(100)   NOT NULL,   -- snapshot at order time
    quantity     INT            NOT NULL,
    price        NUMERIC(10, 2) NOT NULL    -- snapshot at order time
);

INSERT INTO orders (product_id, product_name, quantity, price) VALUES
    (1, 'Laptop', 2, 999.99),
    (2, 'Mouse',  5,  19.99);
