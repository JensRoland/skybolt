<?php

/**
 * Basic Skybolt usage example
 */

require_once __DIR__ . '/../../vendor/autoload.php';

use Skybolt\Skybolt;

// Start session
session_start();

// Create Skybolt instance
$skybolt = new Skybolt(
    manifestPath: __DIR__ . '/dist/.vite/manifest.json',
    basePath: '/assets/',
    session: $_SESSION,
    printComments: true // Enable debug comments
);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skybolt Example</title>

    <?php
    // Critical CSS (inline, synchronous)
    echo $skybolt->criticalCSS('src/critical.css');
    ?>

    <?php
    // Skybolt launcher (must be called once in <head>)
    echo $skybolt->launchScript();
    ?>

    <?php
    // Async CSS (localStorage or external)
    echo $skybolt->asyncCSS('src/main.css');
    ?>
</head>
<body>
    <h1>Hello Skybolt!</h1>
    <p>Check the page source to see how assets are loaded.</p>

    <?php
    // Async JavaScript
    echo $skybolt->asyncScript('src/app.js');
    ?>
</body>
</html>
