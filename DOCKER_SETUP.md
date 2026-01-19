# Finance Tracker - Docker Deployment

This containerized setup includes:

- **Backend**: Flask REST API running on port 5000
- **Web Frontend**: React application running on port 3000
- **Network**: Both services communicate via `finance-network`

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Building and Running

1. Build and start all services:
```bash
docker-compose up -d --build
```

2. Access the application:
- Web UI: http://localhost:3000
- API: http://localhost:5000
- API Docs (if available): http://localhost:5000/api/docs

3. View logs:
```bash
docker-compose logs -f
```

### Stopping the Services

```bash
docker-compose down
```

### Viewing Logs

Backend logs:
```bash
docker-compose logs -f backend
```

Web logs:
```bash
docker-compose logs -f web
```

### Database

The SQLite database is persisted at `./backend/database.db` on the host machine.

### Uploads

User uploads are stored in `./backend/uploads` on the host machine.

## Rebuilding After Changes

If you modify source code:

```bash
docker-compose down
docker-compose up -d --build
```

## Development Notes

- The web frontend expects the API to be at the URL specified in `VITE_API_URL` environment variable
- Backend uploads directory is mounted as a volume for persistence
- Database is mounted as a volume for persistence
- Both services are on the same network for seamless communication
