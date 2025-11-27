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
	docker-compose up --build -d

docker-down:
	docker-compose down

# Run smoke tests (requires Docker)
test: docker-up
	cd ../../tests && npm test; result=$$?; cd ../examples/php-vanilla && docker-compose down; exit $$result
