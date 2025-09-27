.PHONY: install install-relayer install-resolver install-ui install-components \
	dev dev-relayer dev-resolver dev-ui dev-components \
	build build-relayer build-resolver build-ui build-components \
	clean clean-relayer clean-resolver clean-ui clean-components \
	help

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

# Default target
all: help

# Install all dependencies
install: install-components install-relayer install-resolver install-ui
	@echo "$(GREEN)✓ All dependencies installed successfully!$(NC)"

install-components:
	@echo "$(BLUE)Installing ui-components dependencies...$(NC)"
	@cd ui-components && bun install

install-relayer:
	@echo "$(BLUE)Installing relayer dependencies...$(NC)"
	@cd relayer && bun install

install-resolver:
	@echo "$(BLUE)Installing resolver dependencies...$(NC)"
	@cd resolver && bun install

install-ui:
	@echo "$(BLUE)Installing UI dependencies...$(NC)"
	@cd ui && bun install

# Development mode - run all services
dev:
	@echo "$(YELLOW)Starting all services in development mode...$(NC)"
	@echo "$(BLUE)Note: This will run services in parallel. Use Ctrl+C to stop all.$(NC)"
	@make -j4 dev-components dev-relayer dev-resolver dev-ui

# Run individual services
dev-components:
	@echo "$(GREEN)Building ui-components in watch mode...$(NC)"
	@cd ui-components && bun run dev

dev-relayer:
	@echo "$(GREEN)Starting relayer server...$(NC)"
	@cd relayer && bun run dev

dev-resolver:
	@echo "$(GREEN)Starting resolver client...$(NC)"
	@cd resolver && bun run dev

dev-ui:
	@echo "$(GREEN)Starting UI (Next.js)...$(NC)"
	@cd ui && bun run dev

# Build all packages
build: build-components build-relayer build-resolver build-ui
	@echo "$(GREEN)✓ All packages built successfully!$(NC)"

build-components:
	@echo "$(BLUE)Building ui-components...$(NC)"
	@cd ui-components && bun run build

build-relayer:
	@echo "$(BLUE)Building relayer...$(NC)"
	@cd relayer && bun run build

build-resolver:
	@echo "$(BLUE)Building resolver...$(NC)"
	@cd resolver && bun run build

build-ui:
	@echo "$(BLUE)Building UI...$(NC)"
	@cd ui && bun run build

# Start production servers
start: start-relayer start-resolver start-ui

start-relayer:
	@echo "$(GREEN)Starting relayer in production mode...$(NC)"
	@cd relayer && bun run start

start-resolver:
	@echo "$(GREEN)Starting resolver in production mode...$(NC)"
	@cd resolver && bun run start

start-ui:
	@echo "$(GREEN)Starting UI in production mode...$(NC)"
	@cd ui && bun run start

# Clean all dependencies and build artifacts
clean: clean-components clean-relayer clean-resolver clean-ui
	@echo "$(GREEN)✓ All packages cleaned!$(NC)"

clean-components:
	@echo "$(RED)Cleaning ui-components...$(NC)"
	@rm -rf ui-components/node_modules ui-components/dist ui-components/bun.lockb

clean-relayer:
	@echo "$(RED)Cleaning relayer...$(NC)"
	@rm -rf relayer/node_modules relayer/dist relayer/bun.lock

clean-resolver:
	@echo "$(RED)Cleaning resolver...$(NC)"
	@rm -rf resolver/node_modules resolver/dist resolver/bun.lock

clean-ui:
	@echo "$(RED)Cleaning UI...$(NC)"
	@rm -rf ui/node_modules ui/.next ui/bun.lockb

# Reinstall - clean and install fresh
reinstall: clean install
	@echo "$(GREEN)✓ Fresh installation complete!$(NC)"

# Check if all services are ready
check:
	@echo "$(BLUE)Checking package.json files...$(NC)"
	@test -f ui-components/package.json && echo "$(GREEN)✓ ui-components/package.json exists$(NC)" || echo "$(RED)✗ ui-components/package.json missing$(NC)"
	@test -f relayer/package.json && echo "$(GREEN)✓ relayer/package.json exists$(NC)" || echo "$(RED)✗ relayer/package.json missing$(NC)"
	@test -f resolver/package.json && echo "$(GREEN)✓ resolver/package.json exists$(NC)" || echo "$(RED)✗ resolver/package.json missing$(NC)"
	@test -f ui/package.json && echo "$(GREEN)✓ ui/package.json exists$(NC)" || echo "$(RED)✗ ui/package.json missing$(NC)"

# Help command
help:
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                  Zipay Monorepo Makefile                  ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo ""
	@echo "$(GREEN)Installation:$(NC)"
	@echo "  make install           - Install all dependencies"
	@echo "  make install-components- Install ui-components dependencies only"
	@echo "  make install-relayer   - Install relayer dependencies only"
	@echo "  make install-resolver  - Install resolver dependencies only"
	@echo "  make install-ui        - Install UI dependencies only"
	@echo "  make reinstall         - Clean and reinstall everything"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev              - Run all services in development mode"
	@echo "  make dev-components   - Build ui-components in watch mode"
	@echo "  make dev-relayer      - Run relayer server only"
	@echo "  make dev-resolver     - Run resolver client only"
	@echo "  make dev-ui           - Run UI only"
	@echo ""
	@echo "$(GREEN)Production:$(NC)"
	@echo "  make build            - Build all packages"
	@echo "  make build-components - Build ui-components only"
	@echo "  make build-relayer    - Build relayer only"
	@echo "  make build-resolver   - Build resolver only"
	@echo "  make build-ui         - Build UI only"
	@echo "  make start            - Start all services in production"
	@echo "  make start-relayer    - Start relayer in production"
	@echo "  make start-resolver   - Start resolver in production"
	@echo "  make start-ui         - Start UI in production"
	@echo ""
	@echo "$(GREEN)Maintenance:$(NC)"
	@echo "  make clean            - Remove all node_modules and builds"
	@echo "  make clean-components - Clean ui-components only"
	@echo "  make clean-relayer    - Clean relayer only"
	@echo "  make clean-resolver   - Clean resolver only"
	@echo "  make clean-ui         - Clean UI only"
	@echo "  make check            - Check if all package.json files exist"
	@echo ""
	@echo "$(GREEN)Help:$(NC)"
	@echo "  make help             - Show this help message"
	@echo ""
	@echo "$(YELLOW)Tips:$(NC)"
	@echo "  • Use 'make install' after cloning the repo"
	@echo "  • Use 'make dev' to run all services together"
	@echo "  • Press Ctrl+C to stop running services"