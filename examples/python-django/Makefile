.PHONY: install build serve dev clean

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
