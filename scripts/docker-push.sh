#!/bin/bash
set -e

# Default Docker Hub username
DOCKER_USER=${DOCKERHUB_USERNAME:-drleomeng}

# Default tag is latest unless provided as argument
TAG=${1:-latest}

echo "================================================="
echo " MockTrade Docker Image Publisher                "
echo "================================================="
echo "Namespace: $DOCKER_USER"
echo "Tag:       $TAG"
echo "================================================="

# Check if user is logged into Docker Hub
if ! docker info | grep -q 'Username: '; then
    echo "⚠️  You may need to log into Docker Hub first. Run: docker login"
fi

echo -e "\n📦 Building and pushing Server image..."
docker build -t $DOCKER_USER/mocktrade-server:$TAG -f docker/server.Dockerfile .
docker push $DOCKER_USER/mocktrade-server:$TAG

echo -e "\n📦 Building and pushing Web image..."
docker build -t $DOCKER_USER/mocktrade-web:$TAG -f docker/web.Dockerfile .
docker push $DOCKER_USER/mocktrade-web:$TAG

echo -e "\n📦 Building and pushing Nginx image..."
docker build -t $DOCKER_USER/mocktrade-nginx:$TAG -f docker/nginx.Dockerfile .
docker push $DOCKER_USER/mocktrade-nginx:$TAG

echo -e "\n✅ All images successfully built and pushed to Docker Hub!"
echo "Images:"
echo "  - $DOCKER_USER/mocktrade-server:$TAG"
echo "  - $DOCKER_USER/mocktrade-web:$TAG"
echo "  - $DOCKER_USER/mocktrade-nginx:$TAG"
