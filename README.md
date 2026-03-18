# BookWorm - Book Recommendation App

A microservices-based book recommendation application with social features, built with Next.js, Express, and MongoDB.

## Architecture

```
BookWorm/
├── auth-service/          # Authentication microservice (Port 3001)
│   ├── src/
│   ├── Dockerfile
│   └── .env.example
├── book-service/          # Book & recommendation microservice (Port 3002)
│   ├── src/
│   ├── Dockerfile
│   └── .env.example
├── frontend/              # Next.js frontend application (Port 3000)
│   ├── src/
│   ├── public/
│   └── Dockerfile
├── docker-compose.yml     # Container orchestration
└── README.md
```

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### Environment Setup

Create `.env` files for each service:

```bash
cp auth-service/.env.example auth-service/.env
cp book-service/.env.example book-service/.env
cp frontend/.env.example frontend/.env
```

### Start All Services

```bash
docker-compose up -d
docker-compose logs -f
docker-compose ps
```

### Access the Application

- Frontend: http://localhost:3000
- Auth Service: http://localhost:3001
- Book Service: http://localhost:3002
- MongoDB: localhost:27017

## Configuration

### Environment Variables

#### Auth Service (auth-service/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Service port | `3001` |
| `MONGODB_URI` | MongoDB connection string | In-memory DB |
| `JWT_SECRET` | Secret for JWT tokens | Required in production |
| `JWT_EXPIRES_IN` | Token expiration | `60m` |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:3000` |
| `RESEND_API_KEY` | Resend API key for emails | Required for password reset |
| `FROM_EMAIL` | Sender email address | `onboarding@resend.dev` |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` |

#### Book Service (book-service/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Service port | `3002` |
| `MONGODB_URI` | MongoDB connection string | In-memory DB |
| `JWT_SECRET` | Must match auth-service | Required in production |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` |

#### Frontend (frontend/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |
| `AUTH_SERVICE_URL` | Auth service URL | `http://localhost:3001` |
| `BOOK_SERVICE_URL` | Book service URL | `http://localhost:3002` |

## Docker Commands

```bash
docker-compose build
docker-compose up -d
docker-compose down
docker-compose down -v
docker-compose logs -f auth-service
docker-compose restart auth-service
docker-compose up -d --build auth-service
```

## Individual Service Deployment

### Auth Service

```bash
cd auth-service
docker build -t bookworm-auth-service .
docker run -d -p 3001:3001 -e NODE_ENV=production -e MONGODB_URI=mongodb://... -e JWT_SECRET=your-secret bookworm-auth-service
```

### Book Service

```bash
cd book-service
docker build -t bookworm-book-service .
docker run -d -p 3002:3002 -e NODE_ENV=production -e MONGODB_URI=mongodb://... -e JWT_SECRET=your-secret bookworm-book-service
```

### Frontend

```bash
cd frontend
docker build -t bookworm-frontend .
docker run -d -p 3000:3000 -e AUTH_SERVICE_URL=http://auth-service:3001 -e BOOK_SERVICE_URL=http://book-service:3002 bookworm-frontend
```

## Security Considerations

### Production Checklist

- Change all default passwords
- Use strong JWT secrets (32+ characters)
- Configure proper CORS origins
- Enable HTTPS/TLS
- Set up proper MongoDB authentication
- Configure rate limiting
- Set up logging and monitoring
- Use secrets management (Docker secrets, Vault, etc.)

## Production Deployment

### Using Docker Swarm

```bash
docker swarm init
docker stack deploy -c docker-compose.yml bookworm
```

### Using Kubernetes

```bash
kompose convert
kubectl apply -f .
```

### Cloud Deployment

The application can be deployed to:
- AWS: ECS, EKS, or EC2
- Google Cloud: GKE or Cloud Run
- Azure: AKS or Container Instances
- DigitalOcean: App Platform or Kubernetes

## Development

### Local Development without Docker

```bash
# Terminal 1 - Auth Service
cd auth-service
npm install
npm start

# Terminal 2 - Book Service
cd book-service
npm install
npm start

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev
```

## Health Checks

Each service provides health check endpoints:

- Auth Service: `GET http://localhost:3001/api/health`
- Book Service: `GET http://localhost:3002/api/health`
- Frontend: `GET http://localhost:3000/`

## Troubleshooting

### Common Issues

**Services can't connect to MongoDB**
- Check MongoDB container is running: `docker-compose ps mongodb`
- Verify connection string in `.env` files
- Ensure MongoDB health check passes

**Frontend can't reach services**
- Check CORS settings in `.env`
- Verify service URLs match container names
- Check network connectivity: `docker network inspect bookworm-network`

**JWT authentication fails**
- Ensure `JWT_SECRET` is identical in both auth and book services
- Check token expiration settings
- Verify Authorization header is sent correctly

### Useful Commands

```bash
docker-compose logs -f --tail=100
docker-compose exec auth-service sh
docker network inspect bookworm-network
docker volume ls
```

## API Documentation

### Auth Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/verify` | Verify token |
| POST | `/api/auth/logout` | Logout user |
| PUT | `/api/auth/password` | Change password |

### Book Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books/search` | Search books |
| GET | `/api/books/:id` | Get book by ID |
| GET | `/api/books/:id/details` | Get book details |
| POST | `/api/recommendations` | Add recommendation |
| GET | `/api/recommendations/my` | Get my recommendations |
| GET | `/api/recommendations/feed` | Get public feed |
| POST | `/api/social/like/:id` | Toggle like |
| POST | `/api/social/comments` | Add comment |
| POST | `/api/social/follow/:id` | Toggle follow |

## License

MIT License

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request
