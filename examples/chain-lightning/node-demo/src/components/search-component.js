/**
 * Search Component
 *
 * A simple search component that uses lodash-es for debouncing.
 * This demonstrates a component with external package dependencies.
 */

import { debounce } from 'lodash-es'

export class SearchComponent extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
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
        .search-container {
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 8px;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
          border: 2px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        input:focus {
          outline: none;
          border-color: #0066cc;
        }
        .results {
          margin-top: 1rem;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          min-height: 2rem;
        }
      </style>
      <div class="search-container">
        <input type="text" placeholder="Search..." id="search-input">
        <div class="results" id="results">Type to search...</div>
      </div>
    `
  }

  setupListeners() {
    const input = this.shadowRoot.getElementById('search-input')
    const results = this.shadowRoot.getElementById('results')

    // Use debounce from lodash-es
    const debouncedSearch = debounce((query) => {
      if (query.length === 0) {
        results.textContent = 'Type to search...'
      } else {
        results.textContent = `Searching for: "${query}"...`
        // Simulate search delay
        setTimeout(() => {
          results.textContent = `Found 3 results for "${query}"`
        }, 300)
      }
    }, 250)

    input.addEventListener('input', (e) => {
      debouncedSearch(e.target.value)
    })
  }
}

// Register the custom element
customElements.define('search-component', SearchComponent)

export default SearchComponent
