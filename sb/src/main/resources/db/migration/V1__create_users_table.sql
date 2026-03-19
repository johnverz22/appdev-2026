CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
);

-- Optional: Initial admin user (password: password)
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$8.UnVuG9HHgffUDAlk8KnuyWfnyuhdzWMHmUm1u5DBGxuyQXm2AFu', 'ROLE_ADMIN');