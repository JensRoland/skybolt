/**
 * Skybolt bootstrap (cache loader-loader)
 * Loads the cache loader from the cache
 *
 * @author Jens Roland
 * @version 1.0.0
 */
// Run on domready event
window.addEventListener('DOMContentLoaded', function() {
    
    // Fetch the cache loader from localStorage
    let cacheLoader = JSON.parse(localStorage.getItem('sbCacheLoader'));
    // Then create a new script element and replace the old one
    let elm = document.createElement('script');
    elm.innerHTML = cacheLoader.data;
    // Then, locate the script element we're in to run the loader
    let scriptElement = document.getElementById('skybolt-bootstrap');
    scriptElement.parentNode.replaceChild(elm, scriptElement);

}, false);
