<?php
/**
 * Skybolt Server - Inventory endpoint
 * Endpoint for synchronizing Skybolt's server-side (session) and client-side inventories of cached assets.
 * 
 * The client passes a list of assets and their versions to the server, which is then merged into the server's
 * ResourceSession.
 * 
 * This endpoint is currently not in use.
 * 
 * @author Jens Roland
 * @version 1.0.0
 */
session_start();
include_once('resourcesession.php');
$session = new ResourceSession();
if (isset($_POST['assets'])) {
	$session->updateInventory($_POST['assets']);
}
header("HTTP/1.0 204 No Content");

