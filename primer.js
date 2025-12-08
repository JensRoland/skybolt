/**
 * Primer.js
 * 
 * A lightweight library to lazily load JavaScript modules on user interaction.
 * 
 * Usage:
 * Add attributes like `cl-on:click="module.function | [args]"` to HTML elements.
 * The specified module will be dynamically imported and the function executed
 * with the element and optional arguments when the event occurs.
 * 
 * Example:
 * <button cl-on:click="myModule.myFunction | ['arg1', 42]">Click me</button>
 *
 * This will import `myModule`, then call `myFunction(buttonElement, 'arg1', 42)` on click.
 * 
 */
const done = new WeakMap()
const err = console.error.bind(console, '[Primer]')
const listen = document.addEventListener.bind(document)

const handle = (attr, prevent) => async e => {
  const el = e.target.closest(`[cl-on\\:${attr}]`)
  if (!el || done.get(el)?.[attr]) return
  if (prevent) e.preventDefault()

  // Mark as done before awaiting to prevent multiple triggers
  const d = done.get(el) || {}
  d[attr] = true
  done.set(el, d)

  // Parse the attribute
  const [spec, argsJson] = el.getAttribute(`cl-on:${attr}`).split(' | ')
  const [mod, fn] = spec.split('.')
  let args = []
  if (argsJson) {
    try {
      args = JSON.parse(argsJson)
    } catch {
      err(`Invalid JSON: ${argsJson}`)
      return
    }
  }

  el.classList.add('cl-loading')
  try {
    // Dynamically import the module
    const m = await chainLightning.import(mod)
    // Check if function exists
    if (fn) {
      if (typeof m[fn] !== 'function') {
        err(`${mod}.${fn} is not a function`)
        return
      }
      m[fn](el, ...args)
    }
  } catch (err) {
    err(`Failed to load ${mod}:`, err)
  } finally {
    el.classList.remove('cl-loading')
  }
}

listen('click', handle('click', true), true)
listen('focusin', handle('focus', true), true)
listen('mouseover', handle('hover'), true)
