# LOVES-frontend

docker-compose.yml:
```
version: '3.7'
services:
  backend:
    container_name: backend
    build: ./LOVES-backend
    ports:
        - 8081:8080
    networks:
      - react-spring        
  frontend:
    container_name: frontend
    build: ./LOVES-frontend
    ports: 
        - 3001:3000
    depends_on:
      - backend
    networks:
      - react-spring
networks:
  react-spring:
    driver: bridge
```
