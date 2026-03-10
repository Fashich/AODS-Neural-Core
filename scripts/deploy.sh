#!/bin/bash
# AODS - Deployment Script
# Automates deployment to Vercel and Render

set -e

echo "=================================="
echo "AODS Deployment Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is not installed${NC}"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm is not installed${NC}"
        exit 1
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}Docker is not installed (optional)${NC}"
    fi

    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Vercel CLI not installed. Install with: npm i -g vercel${NC}"
    fi

    echo -e "${GREEN}Prerequisites check complete${NC}"
    echo ""
}

# Build frontend
build_frontend() {
    echo "Building frontend..."

    cd frontend

    # Install dependencies
    echo "Installing dependencies..."
    npm install

    # Build
    echo "Building for production..."
    npm run build

    cd ..

    echo -e "${GREEN}Frontend build complete${NC}"
    echo ""
}

# Deploy to Vercel
deploy_vercel() {
    echo "Deploying to Vercel..."

    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}Vercel CLI not installed. Skipping Vercel deployment.${NC}"
        return
    fi

    cd frontend

    # Check if already logged in
    if ! vercel whoami &> /dev/null; then
        echo "Please login to Vercel:"
        vercel login
    fi

    # Deploy
    vercel --prod

    cd ..

    echo -e "${GREEN}Vercel deployment complete${NC}"
    echo ""
}

# Deploy to Render
deploy_render() {
    echo "Deploying to Render..."

    echo -e "${BLUE}Note: Render deployment uses the render.yaml blueprint.${NC}"
    echo -e "${BLUE}Please ensure you have:${NC}"
    echo "  1. Connected your GitHub repository to Render"
    echo "  2. Added the required environment variables in Render Dashboard"
    echo "  3. Deployed using the Blueprint option"
    echo ""

    read -p "Have you configured Render? (y/n): " confirm

    if [[ $confirm == [yY] ]]; then
        echo -e "${GREEN}Render deployment configured${NC}"
    else
        echo -e "${YELLOW}Please configure Render before continuing${NC}"
    fi

    echo ""
}

# Setup database
setup_database() {
    echo "Setting up database..."

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}DATABASE_URL not set. Skipping database setup.${NC}"
        echo "Please set DATABASE_URL and run: psql \$DATABASE_URL -f database/neon_init.sql"
        return
    fi

    echo "Running database initialization..."
    psql "$DATABASE_URL" -f database/neon_init.sql

    echo -e "${GREEN}Database setup complete${NC}"
    echo ""
}

# Run tests
run_tests() {
    echo "Running tests..."

    if [ -f "scripts/test-all.sh" ]; then
        chmod +x scripts/test-all.sh
        ./scripts/test-all.sh
    else
        echo -e "${YELLOW}Test script not found. Skipping tests.${NC}"
    fi

    echo ""
}

# Docker deployment
deploy_docker() {
    echo "Deploying with Docker Compose..."

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose not installed. Skipping Docker deployment.${NC}"
        return
    fi

    # Build and start services
    docker-compose -f docker/docker-compose.yml build
    docker-compose -f docker/docker-compose.yml up -d

    echo -e "${GREEN}Docker deployment complete${NC}"
    echo "Services available at:"
    echo "  - API Gateway: http://localhost:8000"
    echo "  - AI Service: http://localhost:8001"
    echo "  - Telemetry: http://localhost:8002"
    echo ""
}

# Display menu
show_menu() {
    echo "Deployment Options:"
    echo "  1. Full Deployment (Vercel + Render)"
    echo "  2. Frontend Only (Vercel)"
    echo "  3. Backend Only (Render)"
    echo "  4. Local Docker Deployment"
    echo "  5. Database Setup Only"
    echo "  6. Run Tests Only"
    echo "  7. Exit"
    echo ""
}

# Main execution
main() {
    check_prerequisites

    show_menu
    read -p "Select option (1-7): " choice

    case $choice in
        1)
            echo -e "${BLUE}Starting full deployment...${NC}"
            build_frontend
            setup_database
            run_tests
            deploy_vercel
            deploy_render
            ;;
        2)
            echo -e "${BLUE}Deploying frontend only...${NC}"
            build_frontend
            deploy_vercel
            ;;
        3)
            echo -e "${BLUE}Deploying backend only...${NC}"
            setup_database
            deploy_render
            ;;
        4)
            echo -e "${BLUE}Deploying with Docker...${NC}"
            deploy_docker
            ;;
        5)
            echo -e "${BLUE}Setting up database...${NC}"
            setup_database
            ;;
        6)
            echo -e "${BLUE}Running tests...${NC}"
            run_tests
            ;;
        7)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac

    echo ""
    echo -e "${GREEN}==================================${NC}"
    echo -e "${GREEN}Deployment process complete!${NC}"
    echo -e "${GREEN}==================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify deployments at your Vercel and Render dashboards"
    echo "  2. Test the application at your deployed URL"
    echo ""
}

# Run main function
main
