.PHONY: install build serve dev clean tidy

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
