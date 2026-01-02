# CertifyTrack Docker & Deployment Guide Index

## Quick Navigation

### 📋 Setup & Configuration Files

| File | Purpose | Usage |
|------|---------|-------|
| `docker-compose.yml` | Development environment | `docker-compose up -d` |
| `docker-compose.prod.yml` | Production environment | `docker-compose -f docker-compose.prod.yml up -d` |
| `.env.example` | Dev environment template | Copy to `.env` and customize |
| `.env.prod.example` | Prod environment template | Copy to `.env.prod` and customize |
| `nginx.conf` | Nginx reverse proxy config | Auto-loaded by nginx container |
| `init-db.sql` | PostgreSQL initialization | Auto-runs on first startup |

### 🐳 Dockerfiles

| File | Purpose | Details |
|------|---------|---------|
| `BackEnd/Dockerfile` | Backend service image | Multi-stage, Python 3.12, Gunicorn, non-root user |
| `FrontEnd/Dockerfile` | Frontend service image | Multi-stage, Node 18, Vite, serve package |

### 🚀 Automation Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `docker-setup.sh` | Development setup wizard | `./docker-setup.sh [setup\|start\|stop\|logs\|health\|...]` |
| `deploy.sh` | Production deployment | `sudo ./deploy.sh` (for server deployment) |

### 📖 Documentation

| Document | Content |
|----------|---------|
| `DOCKER_SETUP.md` | Complete Docker guide (200+ sections) |
| This file | Quick navigation and index |

---

## 🚀 Quick Start

### Development Environment (5 minutes)

```bash
# 1. Clone repository (if not already done)
git clone https://github.com/PranavKadagadakai/CertifyTrack.git
cd CertifyTrack

# 2. Setup everything interactively
./docker-setup.sh setup

# OR use docker-compose directly
docker-compose up -d

# 3. Access application
# Frontend:  http://localhost:3000
# API:       http://localhost:8000/api/
# Admin:     http://localhost:8000/admin/
```

### Production Deployment (on server)

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Run deployment script
cd /tmp
curl -O https://raw.githubusercontent.com/PranavKadagadakai/CertifyTrack/main/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh

# 3. Follow prompts to configure SSL, environment, etc.
```

---

## 📦 Service Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Nginx (Reverse Proxy)              │
│           Ports: 80 (HTTP), 443 (HTTPS)            │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
        ┌──────▼────────┐    ┌───────▼──────┐
        │  Frontend      │    │   Backend    │
        │  (React/Vite)  │    │  (Django)    │
        │  Port: 3000    │    │  Port: 8000  │
        └────────────────┘    └───────┬──────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
            ┌───────▼────────┐ ┌─────▼──────┐  ┌──────▼──────┐
            │   PostgreSQL   │ │   Redis    │  │   Volumes   │
            │   Port: 5432   │ │ Port: 6379 │  │  (Storage)  │
            └────────────────┘ └────────────┘  └─────────────┘
```

### Services Details

#### PostgreSQL (Database)
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Volume:** `postgres_data` (persistent)
- **Health Check:** Every 10 seconds
- **Credentials:** Configured via `.env`

#### Redis (Cache)
- **Image:** redis:7-alpine
- **Port:** 6379
- **Volume:** `redis_data` (persistent)
- **Purpose:** Session storage, caching, task queue

#### Backend (Django API)
- **Build:** Multi-stage Dockerfile
- **Port:** 8000
- **Workers:** 4 Gunicorn processes
- **Timeout:** 120 seconds
- **Features:** Auto-migrations, static collection, health checks

#### Frontend (React)
- **Build:** Multi-stage Dockerfile (build → serve)
- **Port:** 3000
- **Runtime:** Node.js 18 with serve package
- **Features:** Production optimizations, health checks

#### Nginx (Reverse Proxy)
- **Image:** nginx:alpine
- **Ports:** 80, 443
- **Functions:** 
  - Route requests to appropriate services
  - SSL/TLS termination
  - Static file serving
  - Rate limiting
  - Security headers

---

## 🛠️ Common Commands

### Development Setup

```bash
# Full setup (build, start, migrate, seed)
./docker-setup.sh setup

# Interactive menu
./docker-setup.sh

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Seed initial data (halls)
docker-compose exec backend python manage.py seed_halls

# Access PostgreSQL shell
docker-compose exec postgres psql -U certifytrack_user -d certifytrack

# Backup database
docker-compose exec -T postgres pg_dump -U certifytrack_user certifytrack > backup.sql

# Restore database
docker-compose exec -T postgres psql -U certifytrack_user certifytrack < backup.sql
```

### Static Files & Media

```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Clear and rebuild
docker-compose exec backend python manage.py collectstatic --noinput --clear
```

### Service Management

```bash
# Health check
./docker-setup.sh health

# View service status
docker-compose ps

# Restart specific service
docker-compose restart backend

# Rebuild images
docker-compose build

# Rebuild specific service
docker-compose build backend
```

### Cleanup

```bash
# Stop services and remove containers
docker-compose down

# Also remove volumes
docker-compose down -v

# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -f

# Complete system cleanup
docker system prune -a --volumes
```

---

## 🔒 Security Features

### Implemented in Dockerfiles
- ✅ Non-root user execution (uid 1000)
- ✅ Multi-stage builds for minimal image sizes
- ✅ Health checks enabled
- ✅ Read-only filesystems where applicable

### Implemented in Nginx
- ✅ SSL/TLS (TLSv1.2 + TLSv1.3)
- ✅ HSTS (Strict-Transport-Security)
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- ✅ Rate limiting (100 req/s general, 50 req/s API)
- ✅ CSP and permission headers

### Implemented in Docker Compose
- ✅ Dedicated bridge network
- ✅ No exposed unnecessary ports
- ✅ Database credentials in environment
- ✅ Separate volumes for data isolation

### Best Practices
- 🔐 Use strong, unique passwords in production
- 🔐 Keep `.env` files out of version control
- 🔐 Regularly update images and dependencies
- 🔐 Implement proper backup strategy
- 🔐 Monitor logs for suspicious activity
- 🔐 Use HTTPS in production
- 🔐 Implement rate limiting

---

## 📊 Performance Optimization

### Database
- Connection pooling (PostgreSQL)
- Indexed queries (Django ORM)
- Query optimization with select_related()
- Regular backups with retention

### Caching
- Redis for session storage
- Django cache framework configured
- 30-day cache for static files
- 7-day cache for media files

### Frontend
- Vite bundling and minification
- Tree-shaking for unused code
- Code splitting for lazy loading
- Gzip compression enabled

### Backend
- 4 Gunicorn workers (adjustable)
- 120-second timeout for long requests
- Gzip compression
- Static file serving via Nginx

---

## 🚨 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Verify ports are available
netstat -tuln | grep -E ':(3000|5432|8000|80)'

# Restart Docker daemon
sudo systemctl restart docker
```

### Database connection issues
```bash
# Test connection
docker-compose exec postgres psql -U certifytrack_user -d certifytrack -c "SELECT 1"

# Check networking
docker-compose exec backend ping postgres

# View environment variables
docker-compose exec backend env | grep DB_
```

### Static files not loading
```bash
# Rebuild static files
docker-compose exec backend python manage.py collectstatic --noinput --clear

# Check Nginx config
docker-compose exec nginx nginx -t

# Check file permissions
docker-compose exec backend ls -la staticfiles/
```

### Memory issues
```bash
# Check container resource usage
docker stats

# Reduce Gunicorn workers in docker-compose.yml
# Change: --workers 4 → --workers 2
```

### Port conflicts
```bash
# Find process using port 8000
sudo lsof -i :8000

# Change port in docker-compose.yml
# BACKEND_PORT=8001:8000
```

---

## 📈 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs -f --tail=100

# Specific service
docker-compose logs -f backend

# With timestamps
docker-compose logs -f --timestamps

# Search for errors
docker-compose logs backend | grep ERROR
```

### Health Status

```bash
# Service status
docker-compose ps

# Docker stats (CPU, memory, network)
docker stats

# Specific container stats
docker stats certifytrack_backend

# Health check logs
docker inspect certifytrack_postgres | grep -A 5 HealthCheck
```

### Performance Metrics

```bash
# Image sizes
docker images

# Container disk usage
docker system df

# Network stats
docker network inspect certifytrack_network
```

---

## 🔄 Updates & Upgrades

### Update Application Code

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d
```

### Database Migration

```bash
# Create migration
docker-compose exec backend python manage.py makemigrations

# Apply migration
docker-compose exec backend python manage.py migrate

# View migration status
docker-compose exec backend python manage.py showmigrations
```

### Dependency Updates

```bash
# Update Python dependencies
# Edit BackEnd/requirements.txt, then:
docker-compose build backend

# Update Node dependencies
# Edit FrontEnd/package.json, then:
docker-compose build frontend
```

---

## 📋 Production Checklist

Before deploying to production:

- [ ] Update `SECRET_KEY` in `.env.prod` (generate random key)
- [ ] Set `DEBUG=False` in `.env.prod`
- [ ] Configure email credentials (SMTP)
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
- [ ] Configure database with strong password
- [ ] Setup automated backups
- [ ] Configure SSL auto-renewal (certbot)
- [ ] Setup monitoring and alerting
- [ ] Test all features thoroughly
- [ ] Document deployment details
- [ ] Setup disaster recovery plan
- [ ] Configure Sentry for error tracking (optional)
- [ ] Setup CDN for static assets (optional)

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/reference/)
- [Django Deployment Guide](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [React Deployment Guide](https://react.dev/learn/deployment)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)
- [Redis Docker Guide](https://hub.docker.com/_/redis)

---

## 🤝 Support

For issues:
1. Check DOCKER_SETUP.md troubleshooting section
2. Review Docker logs: `docker-compose logs -f`
3. Check Docker Compose status: `docker-compose ps`
4. Review application logs in container
5. Open GitHub issue with:
   - Error message
   - Command that failed
   - Docker version output
   - System information

---

## 📝 File Structure

```
CertifyTrack/
├── docker-compose.yml              # Development setup
├── docker-compose.prod.yml         # Production setup
├── .env.example                    # Dev env template
├── .env.prod.example               # Prod env template
├── nginx.conf                      # Nginx configuration
├── init-db.sql                     # PostgreSQL init script
├── docker-setup.sh                 # Dev setup wizard
├── deploy.sh                       # Production deployer
├── DOCKER_SETUP.md                 # Detailed guide
├── DOCKER_INDEX.md                 # This file
├── BackEnd/
│   ├── Dockerfile                  # Backend image
│   ├── requirements.txt            # Python dependencies
│   ├── requirements.docker.txt     # Docker-specific deps
│   ├── manage.py                   # Django CLI
│   ├── CertifyTrack/
│   │   ├── settings.py             # Django settings
│   │   ├── urls.py                 # URL routing
│   │   └── wsgi.py                 # WSGI config
│   └── api/
│       ├── models.py               # Database models
│       ├── views.py                # API views
│       ├── urls.py                 # API routes
│       └── management/
│           └── commands/
│               └── seed_halls.py   # Data seeding
└── FrontEnd/
    ├── Dockerfile                  # Frontend image
    ├── vite.config.js              # Vite configuration
    ├── package.json                # Node dependencies
    └── src/
        ├── main.jsx                # React entry
        ├── App.jsx                 # Main component
        ├── api.js                  # API client
        └── components/             # React components
```

---

## 🎯 Performance Targets

- **Page Load Time:** < 2 seconds (frontend)
- **API Response Time:** < 200ms (backend)
- **Database Query:** < 100ms (optimized queries)
- **Image Size (Backend):** ~400MB
- **Image Size (Frontend):** ~250MB
- **Container Memory:** 256MB-512MB per service
- **CPU Usage:** < 50% during normal operation

---

## 📞 Contact & Support

- **GitHub Issues:** https://github.com/PranavKadagadakai/CertifyTrack/issues
- **Email:** pranavkadagadakai@gmail.com
- **Documentation:** See DOCKER_SETUP.md for comprehensive guide

---

**Last Updated:** November 2025  
**Docker Compose Version:** 3.9  
**Target Platforms:** Linux, macOS, Windows (WSL2)  
**Minimum Requirements:** Docker 20.10+, Docker Compose 2.0+

