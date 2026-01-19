#!/bin/bash
# Finance Tracker - Deployment Script
# Run: chmod +x deploy.sh && ./deploy.sh

set -e

echo "=========================================="
echo "  Finance Tracker Deployment"
echo "=========================================="

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "Creating .env file from example..."
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and set:"
    echo "   - OPENAI_API_KEY (for receipt OCR)"
    echo "   - SECRET_KEY (generate a random string)"
    echo ""
    read -p "Press Enter after editing .env, or Ctrl+C to cancel..."
fi

# Check if network exists
if ! docker network inspect bened-platform_bened-network >/dev/null 2>&1; then
    echo "Creating bened-platform_bened-network..."
    docker network create bened-platform_bened-network
fi

# Build and start containers
echo "Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Copy nginx config
echo "Copying nginx configuration..."
cp nginx/finance.beneficialeducationworks.com.conf /opt/bened-platform/nginx/sites/

# Reload nginx
echo "Reloading nginx..."
docker exec bened-nginx nginx -t && docker exec bened-nginx nginx -s reload

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Services running:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep finance-tracker
echo ""
echo "📍 URL: https://finance.beneficialeducationworks.com"
echo ""
echo "Note: You may need to obtain an SSL certificate for the subdomain."
echo "Run: certbot certonly --webroot -w /var/www/certbot -d finance.beneficialeducationworks.com"
echo "Or use the existing wildcard certificate if available."
