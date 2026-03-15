.PHONY: help build up down restart logs clean ps

help:
	@echo "keyPear Docker Commands"
	@echo "======================"
	@echo "make up          - Start all services"
	@echo "make down        - Stop all services"
	@echo "make restart     - Restart all services"
	@echo "make logs        - View logs"
	@echo "make ps          - Show running containers"
	@echo "make clean       - Remove all containers and volumes"
	@echo "make up-monitor  - Start with monitoring stack"

build:
	docker-compose build

up:
	docker-compose up -d

up-monitor:
	docker-compose --profile monitoring up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

ps:
	docker-compose ps

clean:
	docker-compose down -v
	docker system prune -f

# Database commands
db-reset:
	docker-compose down -v
	docker-compose up -d postgres
	sleep 5
	docker-compose up -d

# Development
dev:
	docker-compose up

# Production deploy
deploy:
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.yml up -d --remove-orphans
