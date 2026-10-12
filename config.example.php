<?php
// Copy to config.php OUTSIDE the public directory. Do not commit the real file.
return [
    'storage' => __DIR__ . '/storage',
    // Generate a random token with: php -r 'echo bin2hex(random_bytes(32));'
    // Use it once in /admin/ to create the first administrator; then remove it.
    'setup_token' => '',
];
