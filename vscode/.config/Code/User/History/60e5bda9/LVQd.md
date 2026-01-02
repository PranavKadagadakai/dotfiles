# Docker & Docker Compose Setup Guide

## Overview

This guide provides instructions for building, running, and managing the CertifyTrack application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- At least 4GB RAM available for Docker
- Ports 80, 443, 3000, 5432, 6379, 8000 available

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/PranavKadagadakai/CertifyTrack.git
cd CertifyTrack
```

### 2. Environment Configuration

```bash
# Copy and edit development environment
cp .env.example .env
nano .env  # Edit as needed
```

### 3. Build and Run

**Development:**
```bash
docker-compose up -d
```

**Production:**
```bash
# Copy and edit production environment
cp .env.prod.example .env.prod

# Run with production compose file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser (admin)
docker-compose exec backend python manage.py createsuperuser

# Seed initial data (halls)
docker-compose exec backend python manage.py seed_halls
```

### 5. Access Application

- **Frontend:** http://localhost:3000
- **Admin Panel:** http://localhost:8000/admin/
- **API:** http://localhost:8000/api/

## Docker Compose Configuration

### Services

#### 1. PostgreSQL (`postgres`)
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Volumes:** postgres_data (persistent)
- **Health Check:** Enabled

Database configuration:
```yaml
POSTGRES_DB: certifytrack
POSTGRES_USER: certifytrack_user
POSTGRES_PASSWORD: secure_password_change_me
```

#### 2. Redis (`redis`)
- **Image:** redis:7-alpine
- **Port:** 6379
- **Volumes:** redis_data (persistent)
- **Purpose:** Caching and session management

#### 3. Backend (`backend`)
- **Dockerfile:** BackEnd/Dockerfile
- **Port:** 8000
- **Workers:** 4 Gunicorn workers
- **Depends On:** postgres, redis
- **Volumes:** media files, static files

**Environment Variables:**
```yaml
DEBUG: False (production)
SECRET_KEY: Your Django secret key
DB_HOST: postgres (Docker DNS)
ALLOWED_HOSTS: localhost,127.0.0.1,backend
REDIS_URL: redis://redis:6379/0
```

#### 4. Frontend (`frontend`)
- **Dockerfile:** FrontEnd/Dockerfile
- **Port:** 3000
- **Runtime:** Node.js 18
- **Build Tool:** Vite

**Environment Variables:**
```yaml
VITE_API_BASE_URL: http://localhost:8000/api
NODE_ENV: production
```

#### 5. Nginx (`nginx`)
- **Image:** nginx:alpine
- **Ports:** 80, 443
- **Config:** nginx.conf
- **Purpose:** Reverse proxy, SSL/TLS termination, static file serving

## Dockerfile Details

### Backend Dockerfile (Multi-stage)

**Stage 1: Builder**
- Compiles Python wheels
- Installs build dependencies
- Reduces final image size

**Stage 2: Runtime**
- Minimal base image (python:3.12-slim)
- Non-root user (appuser)
- Health check enabled

**Key Features:**
- Multi-stage build for optimization
- Security: Non-root user
- Health checks every 30 seconds
- Gunicorn with 4 workers
- 120-second timeout for long requests

### Frontend Dockerfile (Multi-stage)

**Stage 1: Builder**
- Installs dependencies (pnpm)
- Builds React application (Vite)

**Stage 2: Runtime**
- Minimal Node.js image
- Non-root user
- Serves with `serve` package

**Key Features:**
- Optimized production build
- Alpine Linux for minimal size
- Security: Non-root user
- Health checks enabled

## Nginx Configuration

### Features

1. **Reverse Proxy**
   - Routes `/api/*` to backend:8000
   - Routes `/` to frontend:3000
   - Routes `/admin/` to backend:8000

2. **SSL/TLS**
   - HTTP to HTTPS redirect
   - TLSv1.2 and TLSv1.3 only
   - Modern cipher suites

3. **Security Headers**
   - HSTS (Strict-Transport-Security)
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: SAMEORIGIN
   - CSP and other protections

4. **Performance**
   - Gzip compression enabled
   - Cache control headers
   - Rate limiting (100 req/s general, 50 req/s API)
   - Keepalive connections

5. **Static Files**
   - `/static/` → /app/staticfiles/ (30-day cache)
   - `/media/` → /app/media/ (7-day cache)

## Common Commands

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Rebuild images
docker-compose build

# Rebuild specific service
docker-compose build backend
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create migration
docker-compose exec backend python manage.py makemigrations

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access database shell
docker-compose exec postgres psql -U certifytrack_user -d certifytrack

# Backup database
docker-compose exec postgres pg_dump -U certifytrack_user certifytrack > backup.sql

# Restore database
docker-compose exec -T postgres psql -U certifytrack_user certifytrack < backup.sql
```

### Static Files

```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Clear static files
docker-compose exec backend rm -rf staticfiles/

# Rebuild static files
docker-compose exec backend python manage.py collectstatic --noinput --clear
```

### Data Management

```bash
# Seed halls
docker-compose exec backend python manage.py seed_halls

# Access Python shell
docker-compose exec backend python manage.py shell

# Run management command
docker-compose exec backend python manage.py <command_name>
```

## Production Deployment

### SSL Certificates Setup

Option 1: Let's Encrypt with Certbot
```bash
mkdir -p nginx/ssl
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/*
```

Option 2: Self-signed certificate (for testing)
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### Production Environment Setup

```bash
# Set production environment variables
cp .env.prod.example .env.prod
nano .env.prod  # Edit with production values

# Key variables to update:
# - SECRET_KEY (generate with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
# - DEBUG=False
# - ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
# - Email credentials
# - Database credentials
# - CORS_ALLOWED_ORIGINS
```

### Start Production Stack

```bash
# Build and start
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Initialize database
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### SSL Auto-Renewal

```bash
# Create renewal script
cat > ssl-renewal.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
EOF

chmod +x ssl-renewal.sh

# Add to crontab for monthly renewal
(crontab -l 2>/dev/null; echo "0 2 1 * * /path/to/ssl-renewal.sh") | crontab -
```

## Monitoring and Logging

### View Logs

```bash
# All services
docker-compose logs -f --tail=100

# Specific service
docker-compose logs -f backend --tail=50

# With timestamps
docker-compose logs -f --timestamps

# Only errors
docker-compose logs backend | grep ERROR
```

### Health Checks

```bash
# View health status
docker-compose ps

# Check specific service
docker-compose exec backend curl http://localhost:8000/api/

# Nginx health
docker-compose exec nginx curl http://localhost/health

# PostgreSQL
docker-compose exec postgres pg_isready
```

### Performance Monitoring

```bash
# Docker stats
docker stats

# Container resource usage
docker-compose stats

# View image sizes
docker images
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend

# Verify port availability
netstat -tuln | grep -E '(3000|5432|8000|80|443)'

# Check Docker daemon
docker ps

# Restart service
docker-compose restart backend
```

### Database Connection Issues

```bash
# Test connection
docker-compose exec postgres psql -U certifytrack_user -d certifytrack -c "SELECT 1"

# Check network
docker-compose exec backend ping postgres

# Verify environment variables
docker-compose exec backend env | grep DB_
```

### Memory Issues

```bash
# Check container memory usage
docker stats

# Increase Docker memory limit in Docker Desktop:
# Preferences → Resources → Memory → Adjust slider

# Reduce Gunicorn workers
# Edit docker-compose.yml and change: --workers 2
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :8000

# Change port in docker-compose.yml
# BACKEND_PORT=8001:8000 (maps 8001 to 8000)

# Or kill the process
kill -9 <PID>
```

### Static Files Not Loading

```bash
# Rebuild static files
docker-compose exec backend python manage.py collectstatic --noinput --clear

# Check permissions
docker-compose exec backend ls -la staticfiles/

# Verify Nginx config
docker-compose exec nginx nginx -t
```

## Cleanup and Maintenance

### Remove Stopped Containers

```bash
docker-compose down
docker container prune -f
```

### Clean Unused Images

```bash
docker image prune -f
```

### Clean All Volumes

```bash
docker-compose down -v
```

### Complete Cleanup

```bash
# WARNING: This removes all stopped containers, unused images, and networks
docker system prune -a --volumes
```

### Database Backup/Restore

```bash
# Backup
docker-compose exec -T postgres pg_dump -U certifytrack_user certifytrack | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U certifytrack_user certifytrack
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique secrets for production
   - Rotate secrets regularly

2. **SSL/TLS**
   - Always use HTTPS in production
   - Keep certificates updated
   - Use strong cipher suites

3. **Network Security**
   - Use bridge network (default)
   - Don't expose unnecessary ports
   - Implement rate limiting

4. **Database**
   - Use complex passwords
   - Regular backups (automated)
   - Restrict database access

5. **Container Security**
   - Run as non-root user (implemented)
   - Use read-only filesystems where possible
   - Scan images for vulnerabilities

6. **Secrets Management**
   - Use Docker secrets for production
   - Use environment variables from secure sources
   - Never log sensitive data

## Performance Optimization

### Database
```bash
# Connection pooling (PgBouncer)
# Add to docker-compose.yml for production

# Query optimization
# Use Django ORM select_related() and prefetch_related()

# Backup strategy
# Implement daily automated backups
```

### Caching
```bash
# Redis configuration
# Already enabled for sessions and caching

# Cache timeout settings
# Adjust based on application needs
```

### Frontend
```bash
# Build optimization
# Vite handles tree-shaking and minification

# Static file caching
# Nginx configured with proper cache headers

# Gzip compression
# Enabled in nginx.conf
```

## Useful Docker Compose Tips

### Run One-off Commands

```bash
# Without entering container
docker-compose run backend python manage.py <command>

# With cleanup
docker-compose run --rm backend python manage.py <command>
```

### Override Compose File

```bash
# Combine multiple compose files
docker-compose -f docker-compose.yml -f docker-compose.override.yml up

# Useful for local development overrides
```

### Scale Services

```bash
# Run multiple backend instances (with load balancer)
docker-compose up -d --scale backend=3
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Docker logs
3. Check Docker Compose documentation
4. Open an issue on GitHub

---

**Last Updated:** November 2025  
**Version:** 1.0.0
