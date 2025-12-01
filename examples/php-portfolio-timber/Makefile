# Timber v2 example - Makefile
# Quick commands for common development tasks

# Install PHP and JS dependencies
install:
	composer install && bun install

# Build frontend assets
build:
	bun run build

# Refresh PHP dependencies
refresh-deps:
	rm -rf vendor && composer update && composer install && bun install && bun run build && docker compose restart

# Start the development server
serve:
	docker compose up --build

# Start in detached mode (background)
start:
	docker compose up -d

# Stop the server
stop:
	docker compose down

# Restart the server
restart:
	docker compose restart timber-v3

# View logs in real-time
logs:
	docker compose logs -f timber-v3

# Enter the container shell
shell:
	docker exec -it timber-v3 bash

# View Apache error log
error-log:
	docker exec timber-v3 tail -f /var/log/apache2/error.log

# Clean up containers and volumes
clean:
	docker compose down -v

# Open the site in browser (macOS)
open:
	open http://localhost:8080/

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

# Show this help message
help:
	@echo "Available Make Targets:"
	@echo ""
	@echo "  make install      - Install PHP and JS dependencies"
	@echo "  make build        - Build frontend assets"
	@echo "  make refresh-deps - Refresh PHP dependencies"
	@echo "  make serve        - Start development server (foreground)"
	@echo "  make start        - Start development server (background)"
	@echo "  make stop         - Stop the server"
	@echo "  make restart      - Restart the server"
	@echo "  make logs         - View logs in real-time"
	@echo "  make shell        - Enter container shell"
	@echo "  make error-log    - View Apache error log"
	@echo "  make clean        - Clean up containers and volumes"
	@echo "  make open         - Open site in browser (macOS)"
	@echo "  make help         - Show this help message"
	@echo ""
	@echo "Site URL: http://localhost:8080/"

.PHONY: serve start stop restart logs test shell error-log clean open refresh-deps help
