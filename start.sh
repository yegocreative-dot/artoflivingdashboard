#!/bin/sh
mkdir -p /var/data/storage
[ -f /var/data/storage/catalogue.json ] || cp -r /var/www/seed-storage/. /var/data/storage/
chown -R www-data:www-data /var/data/storage
chmod 700 /var/data/storage
sed -i "s/Listen 80/Listen ${PORT:-10000}/" /etc/apache2/ports.conf
sed -i "s/:80>/:${PORT:-10000}>/" /etc/apache2/sites-enabled/000-default.conf
exec apache2-foreground
