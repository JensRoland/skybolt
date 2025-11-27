.PHONY: install build serve dev clean test

# Install all dependencies
install:
	npm install
	bundle install

# Build for production
build:
	npm run build

# Run Rails development server
serve:
	bundle exec rackup -p 8080

# Run Vite dev server (for HMR during development)
dev:
	npm run dev

# Clean build artifacts
clean:
	rm -rf public/dist node_modules tmp log

# Run smoke tests (start server, run tests, stop server)
test:
	@echo "Building assets..."
	@npm run build
	@echo "Starting Rails server on port 8085..."
	@bundle exec rackup -p 8085 > /dev/null 2>&1 & echo $$! > .server.pid
	@sleep 5
	@echo "Running tests..."
	@cd ../../tests && npm test -- e2e/ruby-rails.spec.ts; result=$$?; kill `cat ../examples/ruby-rails/.server.pid` 2>/dev/null; rm -f ../examples/ruby-rails/.server.pid; exit $$result
