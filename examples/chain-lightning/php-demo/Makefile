.PHONY: install build serve dev clean

# Install all dependencies
install:
	pnpm install
	composer install

# Build for production
build:
	pnpm run build

# Run PHP development server
serve:
	pnpm run serve

# Run Vite dev server (for HMR during development)
dev:
	pnpm run dev

# Clean build artifacts
clean:
	rm -rf dist node_modules vendor
