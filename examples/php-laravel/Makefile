.PHONY: install build serve dev clean key test

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

# Run smoke tests (start server, run tests, stop server)
test:
	@echo "Building assets..."
	@npm run build
	@echo "Starting PHP server on port 8082..."
	@php -S localhost:8082 -t public public/router.php > /dev/null 2>&1 & echo $$! > .server.pid
	@sleep 2
	@echo "Running tests..."
	@cd ../../tests && npm test -- e2e/php-laravel.spec.ts; result=$$?; kill `cat ../examples/php-laravel/.server.pid` 2>/dev/null; rm -f ../examples/php-laravel/.server.pid; exit $$result
