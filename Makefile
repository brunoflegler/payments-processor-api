prepare:
	docker compose up -d --build

logs:
	docker logs -f processor-api

dev: prepare logs