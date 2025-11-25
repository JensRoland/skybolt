.PHONY: install build serve dev clean key

# Install all dependencies
install:
	npm install
	composer install
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@php artisan key:generate --ansi 2>/dev/null || echo "Note: Run 'make key' after composer install"

# Generate application key
key:
	php artisan key:generate --ansi

# Build for production
build:
	npm run build

# Run PHP development server
serve:
	php -S localhost:8080 -t public public/router.php

# Run Vite dev server (for HMR during development)
dev:
	npm run dev

# Clean build artifacts
clean:
	rm -rf public/build node_modules vendor
