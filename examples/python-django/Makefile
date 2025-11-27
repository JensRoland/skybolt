.PHONY: install build serve dev clean test

# Install all dependencies
install:
	npm install
	uv sync

# Build for production
build:
	npm run build

# Run Django development server
serve:
	uv run python manage.py runserver 8080

# Run Vite dev server (for HMR during development)
dev:
	npm run dev

# Clean build artifacts
clean:
	rm -rf static/dist node_modules .venv

# Run smoke tests (start server, run tests, stop server)
test:
	@echo "Building assets..."
	@npm run build
	@echo "Starting Django server on port 8084..."
	@uv run python manage.py runserver 8084 > /dev/null 2>&1 & echo $$! > .server.pid
	@sleep 3
	@echo "Running tests..."
	@cd ../../tests && npm test -- e2e/python-django.spec.ts; result=$$?; kill `cat ../examples/python-django/.server.pid` 2>/dev/null; rm -f ../examples/python-django/.server.pid; exit $$result
