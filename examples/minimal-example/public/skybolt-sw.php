<?php

/**
 * Skybolt Service Worker Endpoint
 *
 * This file serves the Skybolt Service Worker JavaScript.
 * It automatically loads the latest version from the vendor package.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\AssetEndpoint;

AssetEndpoint::serveServiceWorker();
