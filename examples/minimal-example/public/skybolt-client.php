<?php

/**
 * Skybolt Client Script Endpoint
 *
 * This file serves the Skybolt client-side JavaScript.
 * It automatically loads the latest minified version from the vendor package.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\AssetEndpoint;

AssetEndpoint::serveClient();
