#!/bin/bash
# Build and run KeyPear backend Docker container for Raspberry Pi

set -e

# Configuration
IMAGE_NAME="keypear-backend"
CONTAINER_NAME="keypear-backend"
REGISTRY=""  # e.g., "docker.io/youruser"

# Build for arm64 (Raspberry Pi)
echo "Building Docker image for arm64..."
docker buildx build \
    --platform linux/arm64 \
    -t ${IMAGE_NAME}:latest \
    -t ${IMAGE_NAME}:arm64 \
    -f Dockerfile \
    .

echo "Build complete!"
echo ""
echo "To run locally:"
echo "  docker run -d --name ${CONTAINER_NAME} -p 3001:3001 \\
        -v ./data:/app/data \\
        -v /home/pi/keypear_mount:/app/storage:ro \\
        -e JWT_SECRET=your-secret \\
        -e FRONTEND_URL=https://key-pear.vercel.app \\
        ${IMAGE_NAME}:latest"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose -f docker-compose.simple.yml up -d"
