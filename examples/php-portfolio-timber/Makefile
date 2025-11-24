# Timber v2 example - Makefile
# Quick commands for common development tasks

# Start the development server
serve:
	docker-compose up --build

# Start in detached mode (background)
start:
	docker-compose up -d

# Stop the server
stop:
	docker-compose down

# Restart the server
restart:
	docker-compose restart timber-v3

# View logs in real-time
logs:
	docker-compose logs -f timber-v3

# Enter the container shell
shell:
	docker exec -it timber-v3 bash

# View Apache error log
error-log:
	docker exec timber-v3 tail -f /var/log/apache2/error.log

# Clean up containers and volumes
clean:
	docker-compose down -v

# Open the site in browser (macOS)
open:
	open http://localhost:8080/

refresh-deps:
	rm -rf vendor && composer update && composer install && docker-compose restart

# Show this help message
help:
	@echo "Available Make Targets:"
	@echo ""
	@echo "  make serve        - Start development server (foreground)"
	@echo "  make start        - Start development server (background)"
	@echo "  make stop         - Stop the server"
	@echo "  make restart      - Restart the server"
	@echo "  make logs         - View logs in real-time"
	@echo "  make shell        - Enter container shell"
	@echo "  make error-log    - View Apache error log"
	@echo "  make clean        - Clean up containers and volumes"
	@echo "  make open         - Open site in browser (macOS)"
	@echo "  make refresh-deps - Refresh PHP dependencies"
	@echo "  make help         - Show this help message"
	@echo ""
	@echo "Site URL: http://localhost:8080/"

.PHONY: serve start stop restart logs test shell error-log clean open refresh-deps help
