.PHONY: install build serve dev clean tidy test

# Install all dependencies
install:
	npm install
	go mod tidy

# Download Go dependencies
tidy:
	go mod tidy

# Build for production (assets only - Go compiles on demand)
build:
	npm run build

# Run Go development server
serve:
	go run main.go

# Run Vite dev server (for HMR during development)
dev:
	npm run dev

# Clean build artifacts
clean:
	rm -rf static/dist node_modules

# Run smoke tests (start server, run tests, stop server)
test:
	@echo "Building assets..."
	@npm run build
	@echo "Starting Go server on port 8083..."
	@PORT=8083 go run main.go > /dev/null 2>&1 & echo $$! > .server.pid
	@sleep 3
	@echo "Running tests..."
	@cd ../../tests && npm test -- e2e/go-gin.spec.ts; result=$$?; kill `cat ../examples/go-gin/.server.pid` 2>/dev/null; rm -f ../examples/go-gin/.server.pid; exit $$result
