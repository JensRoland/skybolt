.PHONY: install build serve dev clean docker-up docker-down test

# Install all dependencies
install:
	npm install
	composer install

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
	rm -rf dist node_modules vendor

# Docker commands
docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

# Run smoke tests (start server, run tests, stop server)
test:
	@echo "Building assets..."
	@npm run build
	@echo "Starting PHP server..."
	@php -S localhost:8080 -t dist dist/router.php > /dev/null 2>&1 & echo $$! > .server.pid
	@sleep 2
	@echo "Running tests..."
	@cd ../../tests && npm test -- e2e/php-vanilla.spec.ts; result=$$?; kill `cat ../examples/php-vanilla/.server.pid` 2>/dev/null; rm -f ../examples/php-vanilla/.server.pid; exit $$result
