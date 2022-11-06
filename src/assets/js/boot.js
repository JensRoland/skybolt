/**
 * Bootloader
 * AMD module manager and async asset loader (js, css)
 * 
 * Exports: window.Bootloader
 * 
 * Modules are defined as:
 * 
 * Bootloader.define('module-name',
 *     ['dep1', 'dep2'],  // imported dependencies
 *     (dep1, dep2) => {
 *         // module code
 *         return {};  // exported module
 *     }
 * );
 * 
 * Dynamic importing is done as:
 * 
 * Bootloader.require('module-name', moduleVersion, callbackFn(module));
 * 
 * @author Jens Roland
 * @version 1.0.0
*/
Bootloader = (function(){

	var paths = {
			js: '/scripts/v/',
			css: '/styles/v/'
		},
		resourceCache = {},
		modules = {};


	function loadAsync(cacheResponse, src, fn){
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange=function() {
			if (xhr.readyState==4 && xhr.status==200) {
				if (cacheResponse) resourceCache[src] = xhr.responseText;
				if (typeof fn == 'function') fn(xhr.responseText);
			}
		}
		xhr.open("GET", src, true);
		xhr.send();
	}


	return {
		require: function(moduleName, version, fn){
			var cachedModule = modules[moduleName];
			if (cachedModule && cachedModule.version === version) {
				if (typeof fn == 'function') fn(cachedModule);
			} else {
				loadAsync(false, paths.js + version + '/' + moduleName + '.js', function(data){
					eval(data);
					if (modules[moduleName]) {
						fn(modules[moduleName]);
					} else {
						// error: the loaded file did not define the expected module
					}
				});
			}
		},
		define: function(moduleName, dependencies, creator){
			if (arguments.length == 2) {
				creator = dependencies;
				dependencies = [];
			}

			var len = dependencies.length;
				creatorArguments = [],
				dependenciesLoaded = 0;

			var resolve = function(){
				if (dependenciesLoaded == len) {
					var exports = {};
					creatorArguments.unshift(exports);
					modules[moduleName] = creator.apply( null, creatorArguments );
				}
			};

			for (var i=0; i<len; i++) {
				var j = i;  // keeps the 'i' value fixed inside the closure
				require(dependencies[i].name, dependencies[i].version, function(mod){
					creatorArguments[j] = mod;
					dependenciesLoaded++;
					resolve();
				});
			}
		},
		getScript: function(src, fn) {
			var wasInvoked = false,
				onExecuted = null;

			var resolve = function(){
				if (wasInvoked && resourceCache[src]) {
					eval(resourceCache[src]);
					if (typeof onExecuted == 'function') onExecuted();
				}
			};

			loadAsync(true, src, resolve);

			return {
				execute: function(fn){
					wasInvoked = true;
					onExecuted = fn;
					resolve();
				}
			};
		},
		getStylesheet: function(){
			var wasInvoked = false
				onInjected = null;

			var resolve = function(){
				if (wasInvoked && resourceCache[src]) {
					var css = resourceCache[src],
					    style = document.createElement('style');

					style.type = 'text/css';
					if (style.styleSheet){
						style.styleSheet.cssText = css;
					} else {
						style.appendChild(document.createTextNode(css));
					}
					document.querySelector('head').appendChild(style);
					if (typeof onInjected == 'function') onInjected();
				}
			};

			loadAsync(true, src, resolve);

			return {
				inject: function(fn){
					wasInvoked = true;
					onInjected = fn;
					resolve();
				}
			};
		}
	};

}());
