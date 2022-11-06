<?php
/**
 * Skybolt Server - Asset
 * Class representing a single cacheable asset.
 * 
 * @author Jens Roland
 * @version 1.0.0
 */
class Asset {
	// The original path to the asset file, relative to the site root
	public $path;
	// The name of the resource. This is the resource filename without the extension
	public $name;

	public $version;

	public function __construct($path) {
		$this->path = $path;

		$info = pathinfo($path);
		$this->name = basename($path, '.' . $info['extension']);
		$this->version = $this->fileVersion($path);
	}

	// Gets the hash of the file contents, packs it as base64 (holds more data per character) and uses it as the version
	private function fileVersion($path){
		if (in_array('xxh3', hash_algos())) {
			// Hash the file with XXH3 if available, fallback to MD5
			$hex = hash_file('xxh3', $path);
		} else {
			$hex = hash_file('md5', $path);
		}

		// Hex to URL-friendly base64 string (with - and _ instead of + and /)
		$ver = '';
		foreach(str_split($hex, 2) as $pair){
			$ver .= chr(hexdec($pair));
		}
		$ver = str_replace(array('+','/'), array('-','_'), base64_encode($ver));

		// Return substring
		return substr($ver, 0, ASSET_VERSION_BYTES);
	}

	public function getContents() {
		return file_get_contents($this->path);
	}
}

