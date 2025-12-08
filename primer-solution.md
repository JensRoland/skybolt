# Primer Solution - Conversation Summary

## Chain Lightning vs Qwik Comparison

### What Chain Lightning Does

Chain Lightning solves the **dependency loading holy grail problem** - how to get both fast loading AND efficient caching for sites with complex JS dependency graphs.

**The Holy Grail** (from the README):

> The ability to simply insert a 'script component' tag and have it seamlessly discover its entire dependency tree, begin fetching all of them immediately and in parallel, such that the server only returns non-cached assets, and the client is able to cache everything efficiently. If two components share a dependency, that dependency is only fetched once.

### Key Differences

| Aspect                  | Chain Lightning                       | Qwik                         |
| ----------------------- | ------------------------------------- | ---------------------------- |
| **Core Problem**        | Module waterfall loading              | Hydration overhead           |
| **JavaScript Model**    | Standard ES modules                   | Custom compiler + `$` syntax |
| **Server Languages**    | PHP, Python, Ruby, Go, Node.js        | Node.js only                 |
| **Framework Lock-in**   | None - works with any framework       | Must use Qwik framework      |
| **Initial JS**          | All component JS (loaded in parallel) | ~1KB, rest on-demand         |
| **Time to Interactive** | After JS downloaded + executed        | Instant (no hydration)       |

### Chain Lightning Pros

- Framework agnostic (vanilla JS, web components, any framework)
- No compilation overhead or special syntax
- Multi-language server support
- Predictable mental model - JS runs exactly as written
- Standard browser DevTools debugging
- Incremental adoption into existing MPAs
- ~5ms cached asset responses with Skybolt

### Chain Lightning Cons

- All downloaded JS still executes (unlike Qwik's deferral)
- No state serialization/resumability
- Import maps require modern browser support
- Manual component boundary decisions

### Qwik Pros

- Near-zero initial JS (~1KB)
- Instant interactivity without hydration
- Automatic code splitting at `$` boundaries
- Component state resumability
- Fine-grained loading (only clicked handler loads)

### Qwik Cons

- Framework lock-in
- Learning curve with new mental model
- Smaller ecosystem than React/Vue
- Node.js only (no PHP/Python/Ruby/Go)
- Compiler dependency required

---

## The Primer Feature Proposal

### Background

The user built an "instantly-interactive app framework" in 2012 inspired by Facebook's Primer/Bootloader pattern ([Makinde's Primer gist](https://gist.github.com/makinde/376039)). It allowed:

- Instant interactivity with <1KB initial Primer script
- Fully on-demand component loading triggered by interactions
- Automatic dependency loading using AMD module syntax

Back then, the Bootloader took 10-15KB due to lack of Fetch API, but today it could be replicated in ~10 lines of code.

### Proposed Feature

Since Chain Lightning already has:

- The dependency graph (manifest with component deps)
- Dynamic import with preloading (`chainLightning.import()`)
- Integration with Skybolt's caching

A "Primer" feature adds a thin event delegation layer (~500-600 bytes gzipped) that enables:

- **Instant interactivity** with near-zero initial JS
- **On-demand loading** triggered by user interactions
- **Standard ES modules** - no special syntax or compiler
- **No framework lock-in** - components stay vanilla

---

## Primer API Design

### Attribute Syntax

```html
<!-- Load module on click -->
<button cl-on:click="dialog-component.open">Settings</button>

<!-- Load module with arguments -->
<button cl-on:click='dialog-component.open | ["#settingsDialog", {"modal": true}]'>
  Settings
</button>

<!-- Preload on hover, invoke on click -->
<button
    cl-on:mouseenter="dialog-component"
    cl-on:click='dialog-component.open | ["#settingsDialog", {"modal": true}]'
>
  Settings
</button>

<!-- Load when element enters viewport (lazy components) -->
<div cl-on:inviewport="carousel-component.init">
  <img src="placeholder.jpg" data-src="real-image.jpg">
</div>

<!-- Load when 50% visible -->
<div cl-on:inviewport.50="video-player.init">
  ...
</div>
```

### Attribute Format

```text
cl-on:<event>="<module>[.<function>][ | <json-args>]"
```

- **`<event>`**: One of `click`, `focus`, `mouseenter`, `intent`, `inviewport`, `inviewport.<percent>`
- **`<module>`**: Chain Lightning component name
- **`<function>`**: (Optional) Exported function to call
- **`<json-args>`**: (Optional) JSON array of arguments, separated by ` | `

When a function is specified, it receives:

1. The element as the first argument
2. Any additional arguments from the JSON array

```javascript
// dialog-component.js
export function open(element, selector, options) {
  const dialog = document.querySelector(selector)
  dialog.showModal()
}
```

### Supported Events

| Event          | Trigger                 | Delegation                       |
| -------------- | ----------------------- | -------------------------------- |
| `click`        | User clicks element     | Yes (bubbles)                    |
| `focus`        | Element receives focus  | Yes (via `focusin`)              |
| `mouseenter`   | Mouse enters element    | Yes (via `mouseover`)            |
| `intent`       | Mouse hovers 150ms      | Yes (via `mouseover`/`mouseout`) |
| `inviewport`   | Element enters viewport | No (IntersectionObserver)        |
| `inviewport.N` | Element N% visible      | No (IntersectionObserver)        |

**Event delegation** means instant interactivity — no waiting for DOMContentLoaded. Only `inviewport` requires DOM scanning.

---

## Implementation

```javascript
const done = new WeakMap()    // Tracks fired events per element
const timers = new WeakMap()  // Intent hover timers
const CL = 'cl-loading'       // Loading class

const run = async (el, attr) => {
  const [spec, argsJson] = attr.split(' | ')
  const [mod, fn] = spec.split('.')

  // Parse args early to fail fast
  let args = []
  if (argsJson) {
    try {
      args = JSON.parse(argsJson)
    } catch {
      console.error(`[Primer] Invalid JSON in cl-args: ${argsJson}`)
      return
    }
  }

  el.classList.add(CL)
  try {
    const m = await chainLightning.import(mod)
    if (fn) {
      if (typeof m[fn] !== 'function') {
        console.error(`[Primer] ${mod}.${fn} is not a function`)
        return
      }
      m[fn](el, ...args)
    }
  } catch (err) {
    console.error(`[Primer] Failed to load ${mod}:`, err)
  } finally {
    el.classList.remove(CL)
  }
}

const mark = (el, ev) => {
  const d = done.get(el) || {}
  d[ev] = true
  done.set(el, d)
}

const fired = (el, ev) => done.get(el)?.[ev]

// Click (delegated)
document.addEventListener('click', e => {
  const el = e.target.closest('[cl-on\\:click]')
  if (!el || fired(el, 'click')) return
  e.preventDefault()
  mark(el, 'click')
  run(el, el.getAttribute('cl-on:click'))
}, true)

// Focus (delegated via focusin)
document.addEventListener('focusin', e => {
  const el = e.target.closest('[cl-on\\:focus]')
  if (!el || fired(el, 'focus')) return
  e.preventDefault()
  mark(el, 'focus')
  run(el, el.getAttribute('cl-on:focus'))
}, true)

// Mouseenter (delegated via mouseover)
document.addEventListener('mouseover', e => {
  const el = e.target.closest('[cl-on\\:mouseenter]')
  if (!el || fired(el, 'mouseenter')) return
  mark(el, 'mouseenter')
  run(el, el.getAttribute('cl-on:mouseenter'))
}, true)

// Intent (delegated via mouseover/mouseout + timer)
document.addEventListener('mouseover', e => {
  const el = e.target.closest('[cl-on\\:intent]')
  if (!el || fired(el, 'intent') || timers.has(el)) return
  timers.set(el, setTimeout(() => {
    timers.delete(el)
    mark(el, 'intent')
    run(el, el.getAttribute('cl-on:intent'))
  }, 150))
}, true)

document.addEventListener('mouseout', e => {
  const el = e.target.closest('[cl-on\\:intent]')
  if (el && timers.has(el)) {
    clearTimeout(timers.get(el))
    timers.delete(el)
  }
}, true)

// Inviewport (requires IntersectionObserver per element)
const bindViewport = el => {
  if (fired(el, 'inviewport')) return
  const attr = [...el.attributes].find(a => a.name.startsWith('cl-on:inviewport'))
  if (!attr) return
  const pct = attr.name.split('.')[1]
  const threshold = pct ? parseFloat(pct) / 100 : 0
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting) {
      o.disconnect()
      mark(el, 'inviewport')
      run(el, attr.value)
    }
  }, { threshold }).observe(el)
}

const scanViewport = () => {
  document.querySelectorAll('[cl-on\\:inviewport]').forEach(bindViewport)
}

// Scan for inviewport elements
if (document.body) scanViewport()
else document.addEventListener('DOMContentLoaded', scanViewport)

// Watch for dynamically added inviewport elements
new MutationObserver(scanViewport).observe(
  document.documentElement,
  { childList: true, subtree: true }
)
```

**Estimated size:** ~2100 bytes minified, ~900 bytes gzipped, ~760 byte brotlid

### Loading State

While a module is loading, the element receives the `cl-loading` CSS class. Use this for visual feedback:

```css
[cl-loading] {
  opacity: 0.6;
  pointer-events: none;
}

/* Or with a spinner */
[cl-loading]::after {
  content: '';
  /* spinner styles */
}
```

### Error Handling

Primer logs errors to the console and aborts gracefully:

- **Invalid JSON args**: `[Primer] Invalid JSON in cl-args: ...`
- **Missing export**: `[Primer] module.fn is not a function`
- **Import failure**: `[Primer] Failed to load module: ...`

The `cl-loading` class is always removed, even on error.

---

## Key Insight

The Primer approach offers a middle ground between:

- **Chain Lightning today**: Load all critical JS in parallel upfront
- **Qwik**: Custom framework with resumability

With Primer, Chain Lightning achieves Qwik-like deferred loading while keeping:

- Standard ES modules
- Any server language (PHP, Python, Ruby, Go, Node)
- No compiler or special syntax
- Framework agnosticism

### Comparison

| Aspect              | Chain Lightning    | Chain Lightning + Primer | Qwik         |
| ------------------- | ------------------ | ------------------------ | ------------ |
| Initial JS          | All components     | ~600 bytes               | ~1KB         |
| Time to Interactive | After all JS loads | Instant                  | Instant      |
| On-demand loading   | Manual             | Declarative              | Automatic    |
| Framework required  | No                 | No                       | Yes          |
| Server languages    | Any                | Any                      | Node.js only |
