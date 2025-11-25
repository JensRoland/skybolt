# Skybolt Rails Example

A Ruby on Rails example demonstrating Skybolt's asset caching.

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
ruby-rails/
├── app/
│   ├── assets/
│   │   ├── stylesheets/
│   │   │   ├── critical.css       # Above-the-fold styles
│   │   │   └── application.css    # Main styles
│   │   └── javascripts/
│   │       └── application.js     # Application JavaScript
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   ├── home_controller.rb
│   │   └── service_worker_controller.rb
│   ├── helpers/
│   │   └── skybolt_helper.rb      # Skybolt view helper
│   └── views/
│       ├── layouts/
│       │   └── application.html.erb
│       └── home/
│           └── index.html.erb
├── config/
│   ├── application.rb
│   ├── routes.rb
│   └── environment.rb
├── public/
│   └── dist/                      # Built assets (generated)
├── Gemfile                        # Ruby dependencies
├── vite.config.js                 # Vite configuration
├── package.json                   # NPM dependencies
└── Makefile                       # Build commands
```

## Usage in Rails Templates

```ruby
# app/helpers/skybolt_helper.rb
module SkyboltHelper
  def skybolt
    @skybolt ||= Skybolt::Renderer.new(
      Rails.root.join("public/dist/.skybolt/render-map.json").to_s,
      cookies: cookies.to_h.transform_keys(&:to_s)
    )
  end
end
```

```erb
<%# app/views/layouts/application.html.erb %>
<%= raw skybolt.css("app/assets/stylesheets/critical.css") %>
<%= raw skybolt.launch_script %>
<%= raw skybolt.css("app/assets/stylesheets/application.css") %>

<%= raw skybolt.script("app/assets/javascripts/application.js") %>
```

## Testing the Cache

1. Open DevTools → Network tab
2. Load the page (first visit)
3. Observe: CSS/JS are inlined in the HTML
4. Refresh the page
5. Observe: No network requests for CSS/JS (served by Service Worker)

## Requirements

- Node.js 18+
- Ruby 3.0+
- Bundler
