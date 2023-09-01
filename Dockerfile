FROM php:8.2-apache

# Enable Apache mods
RUN a2enmod ssl && a2enmod rewrite && a2enmod headers && a2enmod expires && a2enmod http2

RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

COPY ./apache/custom-apache.conf /etc/apache2/apache2.conf

EXPOSE 80
