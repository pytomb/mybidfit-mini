#!/bin/bash

# MyBidFit Quick Deploy Script
# Automated deployment script for development and staging environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
ENVIRONMENT=${1:-"development"}
SKIP_TESTS=${2:-"false"}

log_info "Starting MyBidFit deployment for $ENVIRONMENT environment"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    log_error "Invalid environment. Use: development, staging, or production"
    exit 1
fi

# Check dependencies
log_info "Checking dependencies..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm is required but not installed"
    exit 1
fi

log_success "Dependencies check passed"

# Install backend dependencies
log_info "Installing backend dependencies..."
npm ci
log_success "Backend dependencies installed"

# Install frontend dependencies
log_info "Installing frontend dependencies..."
cd frontend
npm ci
cd ..
log_success "Frontend dependencies installed"

# Run tests (unless skipped)
if [ "$SKIP_TESTS" != "true" ]; then
    log_info "Running tests..."
    npm test
    log_success "Tests passed"
else
    log_warning "Tests skipped"
fi

# Run security audit
log_info "Running security audit..."
npm audit --audit-level high
log_success "Security audit passed"

# Build frontend
log_info "Building frontend..."
cd frontend
npm run build
cd ..
log_success "Frontend built successfully"

# Database setup
log_info "Setting up database..."
if [ "$ENVIRONMENT" == "production" ]; then
    log_warning "Skipping database setup for production (should be handled by CI/CD)"
else
    # Run migrations
    npm run db:migrate
    
    # Seed development data
    if [ "$ENVIRONMENT" == "development" ]; then
        npm run db:seed
    fi
    log_success "Database setup completed"
fi

# Start application based on environment
if [ "$ENVIRONMENT" == "development" ]; then
    log_info "Starting development servers..."
    log_success "Deployment completed! Starting development servers..."
    log_info "Backend: http://localhost:3001"
    log_info "Frontend: http://localhost:3000"
    
    # Start both servers concurrently
    npm run dev:full
    
elif [ "$ENVIRONMENT" == "staging" ]; then
    log_info "Building for staging..."
    
    # Set staging environment variables
    export NODE_ENV=staging
    
    # Start application
    log_success "Staging deployment completed!"
    log_info "Application URL: https://staging.mybidfit.com"
    npm start
    
elif [ "$ENVIRONMENT" == "production" ]; then
    log_error "Production deployment should use CI/CD pipeline, not this script"
    log_info "Use: git push origin main"
    log_info "Or manually trigger: GitHub Actions -> Deploy to Production"
    exit 1
fi