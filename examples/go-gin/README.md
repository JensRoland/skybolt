# Skybolt Gin Example

A Go/Gin example demonstrating Skybolt's asset caching.

## Quick Start

```bash
# Install dependencies
make install

# Build assets
make build

# Run development server
make serve

# Visit http://localhost:8080
```

## What This Demonstrates

1. **First Visit**: Assets are inlined in the HTML with `sb-*` attributes
2. **Service Worker**: Registers and caches the inlined assets
3. **Repeat Visit**: Assets are served from Service Worker cache (~1ms)
4. **Cache Invalidation**: Rebuild with `make build`, refresh to see new assets cached

## File Structure

```text
go-gin/
├── main.go                    # Gin application
├── go.mod                     # Go module definition
├── static/
│   ├── css/
│   │   ├── critical.css       # Above-the-fold styles
│   │   └── app.css            # Main styles
│   ├── js/
│   │   └── app.js             # Application JavaScript
│   └── dist/                  # Built assets (generated)
├── templates/
│   └── index.html             # Go template
├── vite.config.js             # Vite configuration
├── package.json               # NPM dependencies
└── Makefile                   # Build commands
```

## Usage in Go Templates

```go
// main.go
sb, _ := skybolt.New("static/dist/.skybolt/render-map.json", cookies, "")
c.HTML(200, "index.html", gin.H{"sb": sb})
```

```html
<!-- index.html -->
{{ .sb.CSS "static/css/critical.css" | safe }}
{{ .sb.LaunchScript | safe }}
{{ .sb.CSS "static/css/app.css" | safe }}

{{ .sb.Script "static/js/app.js" true | safe }}
```

## Testing the Cache

1. Open DevTools → Network tab
2. Load the page (first visit)
3. Observe: CSS/JS are inlined in the HTML
4. Refresh the page
5. Observe: No network requests for CSS/JS (served by Service Worker)

## Requirements

- Node.js 18+
- Go 1.21+
