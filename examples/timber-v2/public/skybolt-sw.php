<?php

/**
 * Skybolt Service Worker Endpoint
 *
 * This file serves the Skybolt Service Worker JavaScript.
 * It automatically loads the latest version from the vendor package.
 *
 * URL: /skybolt-sw.php (or configure your web server to rewrite /skybolt-sw.js to this file)
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\AssetEndpoint;

AssetEndpoint::serveServiceWorker();
