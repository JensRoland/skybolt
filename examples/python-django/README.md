# Skybolt Django Example

A Django example demonstrating Skybolt's asset caching using uv for Python dependency management.

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
3. **Repeat Visit**: Assets are served from Service Worker cache (~5ms)
4. **Cache Invalidation**: Rebuild with `make build`, refresh to see new assets cached

## File Structure

```text
python-django/
├── skybolt_example/
│   ├── __init__.py
│   ├── settings.py            # Django settings
│   ├── urls.py                # URL routing
│   ├── views.py               # Views with Skybolt integration
│   └── wsgi.py
├── static/
│   ├── css/
│   │   ├── critical.css       # Above-the-fold styles
│   │   └── app.css            # Main styles
│   ├── js/
│   │   └── app.js             # Application JavaScript
│   └── dist/                  # Built assets (generated)
├── templates/
│   └── index.html             # Django template
├── manage.py                  # Django management script
├── pyproject.toml             # Python dependencies (uv)
├── vite.config.js             # Vite configuration
├── package.json               # NPM dependencies
└── Makefile                   # Build commands
```

## Usage in Django Templates

```python
# views.py
from skybolt import Skybolt

def index(request):
    sb = Skybolt("static/dist/.skybolt/render-map.json", cookies=request.COOKIES)
    # Pre-render assets (Django templates don't support method calls with args)
    return render(request, "index.html", {
        "critical_css": sb.css("static/css/critical.css"),
        "app_css": sb.css("static/css/app.css"),
        "app_js": sb.script("static/js/app.js"),
        "launch_script": sb.launch_script(),
    })
```

```html
<!-- index.html -->
{{ critical_css|safe }}
{{ launch_script|safe }}
{{ app_css|safe }}

{{ app_js|safe }}
```

## Testing the Cache

1. Open DevTools → Network tab
2. Load the page (first visit)
3. Observe: CSS/JS are inlined in the HTML
4. Refresh the page
5. Observe: No network requests for CSS/JS (served by Service Worker)

## Requirements

- Node.js 18+
- Python 3.10+
- uv (Python package manager)
