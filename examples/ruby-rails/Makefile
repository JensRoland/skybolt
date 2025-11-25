.PHONY: install build serve dev clean

# Install all dependencies
install:
	npm install
	bundle install

# Build for production
build:
	npm run build

# Run Rails development server
serve:
	bundle exec rails server -p 8080

# Run Vite dev server (for HMR during development)
dev:
	npm run dev

# Clean build artifacts
clean:
	rm -rf public/dist node_modules tmp log
