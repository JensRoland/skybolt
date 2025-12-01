.PHONY: install build serve test clean
# Quick commands for common development tasks

# Install PHP and JS dependencies
install:
	composer install && bun install

# Build frontend assets
build:
	bun run build

# Start the development server
serve:
	docker compose up --build

# Clean up dependencies
clean:
	rm -rf dist vendor node_modules

# Run smoke tests (uses port 8081 to avoid conflicts)
test:
	@echo "Starting Docker container on port 8081..."
	PORT=8081 docker compose up --build -d
	@echo "Waiting for server to be ready..."
	@timeout=30; while [ $$timeout -gt 0 ]; do \
		if curl -s http://localhost:8081/ > /dev/null 2>&1; then \
			echo "Server is ready!"; \
			break; \
		fi; \
		sleep 1; \
		timeout=$$((timeout - 1)); \
	done; \
	if [ $$timeout -eq 0 ]; then \
		echo "Timeout waiting for server"; \
		docker compose down; \
		exit 1; \
	fi
	@echo "Running tests..."
	cd ../../tests && npm test -- e2e/php-portfolio-timber.spec.ts; result=$$?; cd ../examples/php-portfolio-timber && docker compose down; exit $$result
