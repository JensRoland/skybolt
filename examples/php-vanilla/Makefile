.PHONY: install build serve dev clean

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
