<?php

/**
 * Example inventory endpoint
 *
 * This endpoint receives cache inventory updates from the client
 * Place this file somewhere accessible (e.g., /api/skybolt/inventory.php)
 */

require_once __DIR__ . '/../../vendor/autoload.php';

use Skybolt\Skybolt;

// Start session
session_start();

// Create Skybolt instance
$skybolt = new Skybolt(
    manifestPath: __DIR__ . '/dist/.vite/manifest.json',
    basePath: '/assets/',
    session: $_SESSION
);

// Handle the inventory update
$skybolt->handleInventoryUpdate();

// Respond with 204 No Content
http_response_code(204);
