FROM php:8.2-cli

# Install php drivers for postgres
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY index.php .

EXPOSE 8000

# command to start the app with PHP's built-in server
CMD ["php", "-S", "0.0.0.0:8000", "index.php"]

