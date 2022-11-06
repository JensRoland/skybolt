<?php
/**
 * Skybolt Server - ResourceSession
 * Wrapper around Session that maintains a server side copy of the client 'inventory',
 * that is, the list of asset-version pairs that the client has already cached.
 * 
 * Detects if the request is a 'cold load' and requests an inventory update from the client.
 * If not, assumes that the client Skybolt cache has the inventory as recorded in the ResourceSession.
 * 
 * Provides the public function `hasLatestVersion($asset)` which can be used to check if the active client
 * has the latest version of a particular asset.
 * 
 * TODO: Refactor this, it's a mess of side effects and mixed responsibilities
 * 
 * @author Jens Roland
 * @version 1.0.0
 */
include_once('config.php');

class ResourceSession {
	private $assets = array();
	private $assetKey = 'assets';

	public function __construct() {
		$loaderKey = 'loadercached';
		$inventoryKey = 'inventory';
		$cachebusterKey = 'cachebuster';


		// Cache busted? (triggered when the client side selfdestructs) If so, all stored assets are invalidated
		if (isset($_COOKIE[$cachebusterKey])) {
			$_SESSION[$this->assetKey] = array();
			session_write_close();

			ResourceSession::unsetcookie($cachebusterKey);
			ResourceSession::unsetcookie($this->assetKey);
			ResourceSession::unsetcookie($loaderKey);
			return;
		}

		// For repeat views within a live session, we can use our stored resource data
		if (isset($_SESSION[$this->assetKey]))
		{
			$this->assets = $_SESSION[$this->assetKey];
			if (isset($_COOKIE[$inventoryKey])) ResourceSession::unsetcookie($inventoryKey);
		} else {
			// For initial views (first pageview in a new session) we need to ask the client for a full localStorage inventory
			// (will be passed in an XHR)
			setcookie($inventoryKey, 1, time()+1800);
		}

		// If the client passed an array of stored assets with the current request,
		// these are merged into the session data
		// This performs an upsert since the client may pass only the assets it has just cached,
		// rather than its full inventory
		if (isset($_COOKIE[$this->assetKey])) {
			$this->updateInventory($_COOKIE[$this->assetKey]);

			// Expire the cookie now that we're done with it
			ResourceSession::unsetcookie($this->assetKey);
		}

		// If the client passed a 'loaderCached' cookie, we register the loader as cached
		if (isset($_COOKIE[$loaderKey])) {
			$this->assets[SKYBOLT_LOADER_NAME] = $_COOKIE[$loaderKey];
			// Expire the cookie now that we're done with it
			ResourceSession::unsetcookie($loaderKey);
		}

		// Put resource data in session
		$_SESSION[$this->assetKey] = $this->assets;
		session_write_close();

	}

	public function updateInventory($inventoryJSON) {
		// JSON quotation marks are escaped in the cookie value, so we need to unescape them
		$inventoryData = json_decode(str_replace('\\"', '"', $inventoryJSON), true);

		foreach($inventoryData as $assetName=>$version) {
				$this->assets[$assetName] = $version;
		}
	}


	public static function unsetcookie($key){
		setcookie($key, '', time()-86400);
	}

	
	public function hasLatestVersion($asset) {
		if ($this->assets == null) {
			return false;
		}
		return array_key_exists($asset->name, $this->assets) 
			&& $this->assets[$asset->name] == $asset->version;
	}

}
