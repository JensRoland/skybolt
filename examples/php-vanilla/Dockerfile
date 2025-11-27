FROM php:8.2-cli

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Expose the PHP dev server port
EXPOSE 8080

# Start the PHP dev server (serving from dist with router)
CMD ["php", "-S", "0.0.0.0:8080", "-t", "dist", "dist/router.php"]
