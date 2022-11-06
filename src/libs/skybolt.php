<?php
/**
 * Skybolt Server
 * Singleton class that handles the Skybolt server-side functionality
 * 
 * Reads all assets in the 'assets' directory and keeps them in memory for the duration of a single request.
 * 
 * Provides methods for inserting these assets into HTML pages:
 * 
 *   - $skybolt->insertScript($name)
 *   - $skybolt->insertStylesheet($name)
 *   - $skybolt->insertFragment($name)
 * 
 * @author Jens Roland
 * @version 1.0.0
 */
include_once('config.php');
include_once('asset.php');
include_once('resourcesession.php');

class Skybolt {

	// Singleton pattern
	private static $instance;

	// Constants
	const VANITY_INLINED = '<!-- Inlined by Skybolt -->';
	const VANITY_CACHED = '<!-- Cached by Skybolt -->';
	const ATTR_PREFIX = 'sb-';
	const SKYBOLT_ATTR = 'state';

	// Class members
	private $session;
	private $assets; // Available assets on disk


	// Constructor
	private function __construct()
	{
		// Initialization here
		$this->session = new ResourceSession();

		// Asset types: Scripts, styles and HTML fragments
		$this->assets = array();
		$this->assets['js'] = $this->getAssetsInFolder('assets/js');
		$this->assets['css'] = $this->getAssetsInFolder('assets/css');
		$this->assets['html'] = $this->getAssetsInFolder('assets/html');
	}


	private function getAssetsInFolder($path)
	{
		$assetCollection = array();

		if ($handle = opendir($path)) {
			// Loops through each file in the folder
			while (false !== ($entry = readdir($handle)))
			{
				// Instantiates that file as an Asset
				$asset = new Asset($path . '/' . $entry);
				// And adds it to the asset array
				if (substr($asset->name,0,1) != '.') {
					$assetCollection[$asset->name] = $asset;
				}
			}
		}
		return $assetCollection;
	}


	private function getAsset($type, $name)
	{
		return $this->assets[$type][$name];
	}

	private function assetToMarkup($asset, $wrapperType, $store=true)
	{
		$name = $asset->name;
		$ver = $asset->version;

		$output = '';

		$assetAttributes = array(
			self::ATTR_PREFIX.'type' => $wrapperType,
			self::ATTR_PREFIX.'name' => $name,
			self::ATTR_PREFIX.'version' => $ver
		);

		if ( ! $this->session->hasLatestVersion($asset))
		{
			if ($store){
				$assetAttributes[self::ATTR_PREFIX.self::SKYBOLT_ATTR] = 'store';
			}

			$output = PHP_EOL . $this->buildTag($wrapperType, $assetAttributes, FALSE, $asset->getContents());

			if (PRINT_VANITY_COMMENTS) {
				$output = PHP_EOL . self::VANITY_INLINED . $output;
			}
		}
		else
		{
			$assetAttributes[self::ATTR_PREFIX.self::SKYBOLT_ATTR] = 'load';

			$output = $this->buildTag('meta', $assetAttributes);

			// TODO: Use a customElement instead of a meta tag: https://github.com/mdn/web-components-examples/blob/main/composed-composed-path/main.js

			if (PRINT_VANITY_COMMENTS) {
				$output = $output . ' ' . self::VANITY_CACHED;
			}
		}

		return $output . PHP_EOL;
	}


	private function buildTag($tagName, $attributes, $voidElement=true, $contents='')
	{
		$tag = '<'.$tagName;
		foreach ($attributes as $key => $value) {
			$tag .= " {$key}='{$value}'";
		}
		$tag .= '>';

		// Add closing tag and (optionally) content
		if ( ! $voidElement) {
			if ($contents != '') {
				$tag .= PHP_EOL . $contents . PHP_EOL;
			}
			$tag .= "</{$tagName}>";
		}

		return $tag;
	}



	// PUBLIC INTERFACE

	public function insertScript($name, $store=true)
	{
		$asset = $this->getAsset('js', $name);
		print( $this->assetToMarkup($asset, 'script', $store) );
	}

	public function insertStylesheet($name, $store=true)
	{
		$asset = $this->getAsset('css', $name);
		print( $this->assetToMarkup($asset, 'style', $store) );
	}

	public function insertFragment($name, $store=true)
	{
		$asset = $this->getAsset('html', $name);
		print( $this->assetToMarkup($asset, 'div', $store) );
	}



	// Renderer specifically for the cache loader (the only script we can't keep in localStorage)
	public function head() {
		$asset = $this->getAsset('js', SKYBOLT_LOADER_NAME);

		if ( ! $this->session->hasLatestVersion($asset))
		{
			$this->insertScript($asset->name, false);
		}
		else
		{
			$loaderSrc = SITE_ROOT . 'scripts/v/'.$asset->version.'/'.$asset->name.'.js'; // TODO: URL resolution helper

			$output = $this->buildTag('script', array('src'=>$loaderSrc), false) . PHP_EOL;
			print($output);

			// Let's try flushing the response here, maybe we'll get a slight boost to TTFB
			ob_flush();
			flush();
		}
	}

	// At the bottom of the <body>, we load all necessary assets from cache and store anything that was inlined
	public function body() {
		$this->insertScript('skybolt-store');
		$output = "\t<script>Skybolt.loadFromCache();</script>" . PHP_EOL;
		print($output);
	}



	// Get singleton
	public static function getInstance()
	{
		if ( is_null( self::$instance ) )
		{
			self::$instance = new self();
		}
		return self::$instance;
	}

}

$skybolt = Skybolt::getInstance();

