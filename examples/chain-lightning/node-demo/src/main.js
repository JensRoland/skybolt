/**
 * Main entry point
 *
 * This is a simple main script that doesn't depend on any components.
 * Components are loaded via Chain Lightning on the server side.
 */

console.log('[Main] Application initialized')

// Expose a simple API for testing dynamic component loading
window.loadComponent = async (name) => {
  console.log(`[Main] Dynamically loading component: ${name}`)
  const module = await window.chainLightning.import(name)
  console.log(`[Main] Component loaded:`, module)
  return module
}
