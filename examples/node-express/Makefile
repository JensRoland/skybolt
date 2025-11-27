.PHONY: install build serve dev clean docker-up docker-down test

# Install all dependencies
install:
	npm install

# Build for production
build:
	npm run build

# Run Express server
serve:
	node server.js

# Run Vite dev server (for HMR during development)
dev:
	npm run dev

# Clean build artifacts
clean:
	rm -rf dist node_modules

# Docker commands
docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

# Run smoke tests (start server, run tests, stop server)
test:
	@echo "Building assets..."
	@npm run build
	@echo "Starting Express server..."
	@node server.js > /dev/null 2>&1 & echo $$! > .server.pid
	@sleep 2
	@echo "Running tests..."
	@cd ../../tests && npm test -- e2e/node-express.spec.ts; result=$$?; kill `cat ../examples/node-express/.server.pid` 2>/dev/null; rm -f ../examples/node-express/.server.pid; exit $$result
