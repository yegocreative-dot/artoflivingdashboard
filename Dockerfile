FROM php:8.3-apache
RUN a2enmod rewrite headers
RUN printf 'upload_max_filesize=20M\npost_max_size=21M\n' > /usr/local/etc/php/conf.d/uploads.ini
RUN printf '<Directory /var/www/html>\n  AllowOverride All\n</Directory>\nSetEnvIf X-Forwarded-Proto https HTTPS=on\n' > /etc/apache2/conf-enabled/aol.conf
COPY app /var/www/app
COPY public /var/www/html
COPY storage /var/www/seed-storage
RUN printf "<?php\nreturn ['storage'=>'/var/data/storage','setup_token'=>getenv('AOL_SETUP_TOKEN')?:''];\n" > /var/www/config.php
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]
