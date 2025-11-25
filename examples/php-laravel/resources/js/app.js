/**
 * Skybolt Laravel Example - Application JS
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[App] Initializing...')

    // Update cache status display
    await updateCacheStatus()

    // Set up button handlers
    setupButtons()

    console.log('[App] Ready!')
})

/**
 * Update the cache status display
 */
async function updateCacheStatus() {
    const statusEl = document.getElementById('cache-status')
    if (!statusEl) return

    // Check if we have the skybolt client
    if (typeof window.skybolt === 'undefined') {
        statusEl.textContent = 'Skybolt client not loaded'
        statusEl.className = 'cache-status not-cached'
        return
    }

    try {
        const info = await window.skybolt.getCacheInfo()

        if (info.count > 0) {
            statusEl.innerHTML = `
                <strong>Cache Status:</strong> Active<br>
                <strong>Cached Assets:</strong> ${info.count}<br>
                <strong>Cache Name:</strong> ${info.name}<br>
                <br>
                <strong>Cached URLs:</strong><br>
                ${info.urls.map(url => `• ${new URL(url).pathname}`).join('<br>')}
            `
            statusEl.className = 'cache-status cached'
        } else {
            statusEl.innerHTML = `
                <strong>Cache Status:</strong> Empty<br>
                <strong>Cache Name:</strong> ${info.name}<br>
                <br>
                <em>Assets will be cached on page load.</em>
            `
            statusEl.className = 'cache-status not-cached'
        }
    } catch (err) {
        statusEl.textContent = `Error: ${err.message}`
        statusEl.className = 'cache-status not-cached'
    }
}

/**
 * Set up button click handlers
 */
function setupButtons() {
    // Clear cache button
    const clearBtn = document.getElementById('clear-cache')
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (typeof window.skybolt !== 'undefined') {
                await window.skybolt.clearCache()
                alert('Cache cleared! Refresh the page to see assets re-cached.')
                await updateCacheStatus()
            }
        })
    }

    // Self-destruct button
    const destroyBtn = document.getElementById('self-destruct')
    if (destroyBtn) {
        destroyBtn.addEventListener('click', async () => {
            if (confirm('This will clear all caches, unregister the Service Worker, and reload the page. Continue?')) {
                if (typeof window.skybolt !== 'undefined') {
                    await window.skybolt.selfDestruct()
                }
            }
        })
    }

    // Refresh status button
    const refreshBtn = document.getElementById('refresh-status')
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => updateCacheStatus())
    }
}
