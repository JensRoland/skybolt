<?php
/**
 * Skybolt Server - Configuration file
 * Global configuration for Skybolt Server.
 * 
 * @author Jens Roland
 * @version 1.0.0
 */

// URL path to the public Skybolt system scripts
define('SITE_ROOT', '/skybolt2021/');

// Name of the Skybolt loader script (without the '.js' extension)
define('SKYBOLT_LOADER_NAME', 'skybolt-load');

// Output vanity comments for cached and inlined assets?
define('PRINT_VANITY_COMMENTS', FALSE);

// Number of base64-encoded hash bytes to use in asset versions
define('ASSET_VERSION_BYTES', 6);
