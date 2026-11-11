FROM php:8.2-apache

# Install system dependencies and PHP extensions for Drupal 11
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-configure gd --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd opcache pdo pdo_mysql zip \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Configure Apache DocumentRoot to point to web/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/web
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Configure production PHP settings
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=60'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'upload_max_filesize=100M'; \
    echo 'post_max_size=100M'; \
    echo 'memory_limit=256M'; \
} > /usr/local/etc/php/conf.d/drupal-recommended.ini

WORKDIR /var/www/html

# Copy application files
COPY . .

# Set appropriate permissions for web root and files directory
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/web \
    && mkdir -p /var/www/html/web/sites/default/files \
    && chmod -R 775 /var/www/html/web/sites/default/files

EXPOSE 80

CMD ["apache2-foreground"]
