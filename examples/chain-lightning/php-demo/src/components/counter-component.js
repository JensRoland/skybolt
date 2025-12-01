/**
 * Counter Component
 *
 * A simple counter component that uses lodash-es for throttling.
 * Shares the lodash-es dependency with search-component.
 */

import { throttle } from 'lodash-es'

export class CounterComponent extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.count = 0
  }

  connectedCallback() {
    this.render()
    this.setupListeners()
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, sans-serif;
        }
        .counter-container {
          padding: 1rem;
          background: #e8f4fd;
          border-radius: 8px;
          text-align: center;
        }
        .count {
          font-size: 3rem;
          font-weight: bold;
          color: #0066cc;
          margin: 1rem 0;
        }
        button {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          margin: 0 0.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .increment {
          background: #0066cc;
          color: white;
        }
        .increment:hover {
          background: #0052a3;
        }
        .decrement {
          background: #cc3300;
          color: white;
        }
        .decrement:hover {
          background: #a32900;
        }
        .info {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #666;
        }
      </style>
      <div class="counter-container">
        <div class="count" id="count">0</div>
        <button class="decrement" id="decrement">- Decrease</button>
        <button class="increment" id="increment">+ Increase</button>
        <div class="info">Buttons are throttled (100ms)</div>
      </div>
    `
  }

  updateDisplay() {
    this.shadowRoot.getElementById('count').textContent = this.count
  }

  setupListeners() {
    // Use throttle from lodash-es to prevent rapid clicking
    const throttledIncrement = throttle(() => {
      this.count++
      this.updateDisplay()
    }, 100)

    const throttledDecrement = throttle(() => {
      this.count--
      this.updateDisplay()
    }, 100)

    this.shadowRoot.getElementById('increment').addEventListener('click', throttledIncrement)
    this.shadowRoot.getElementById('decrement').addEventListener('click', throttledDecrement)
  }
}

// Register the custom element
customElements.define('counter-component', CounterComponent)

export default CounterComponent
