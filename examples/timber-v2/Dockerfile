# Timber v2 Development Environment
# Apache + PHP with mod_rewrite support for .htaccess

FROM php:8.3-apache

# Enable Apache modules required for Skybolt
RUN a2enmod rewrite headers expires

# Install additional PHP extensions if needed
RUN docker-php-ext-install opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configure PHP for development
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini" && \
    echo "error_reporting = E_ALL" >> "$PHP_INI_DIR/php.ini" && \
    echo "display_errors = On" >> "$PHP_INI_DIR/php.ini" && \
    echo "display_startup_errors = On" >> "$PHP_INI_DIR/php.ini"

# Set the working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Configure Apache DocumentRoot to point to public directory
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf && \
    sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/apache2.conf

# Configure Apache to allow .htaccess overrides
RUN echo '<Directory /var/www/html/public>' > /etc/apache2/conf-available/timber-v2.conf && \
    echo '    Options Indexes FollowSymLinks' >> /etc/apache2/conf-available/timber-v2.conf && \
    echo '    AllowOverride All' >> /etc/apache2/conf-available/timber-v2.conf && \
    echo '    Require all granted' >> /etc/apache2/conf-available/timber-v2.conf && \
    echo '</Directory>' >> /etc/apache2/conf-available/timber-v2.conf && \
    a2enconf timber-v2

# Expose port 80
EXPOSE 80

# Start Apache in foreground
CMD ["apache2-foreground"]
