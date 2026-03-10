FROM php:8.2-cli

# Install the PostgreSQL PDO driver
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY index.php .

EXPOSE 8000

# Use PHP's built-in server for simplicity (fine for demos)
CMD ["php", "-S", "0.0.0.0:8000", "index.php"]
