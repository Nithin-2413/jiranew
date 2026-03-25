# Production Deployment Checklist

Use this checklist when deploying the Jira Report Maker to production.

## Pre-Deployment Checklist

### Backend Configuration

- [ ] **Environment Variables**
  - [ ] `MONGO_URL` points to production MongoDB instance (with authentication)
  - [ ] `DB_NAME` set to production database name
  - [ ] `CORS_ORIGINS` set to production frontend URL(s) only (remove localhost)
  - [ ] Remove or secure `.env` file (use environment variables instead)

- [ ] **Security**
  - [ ] MongoDB authentication enabled
  - [ ] MongoDB network access restricted
  - [ ] HTTPS/TLS enabled for backend API
  - [ ] Rate limiting configured (optional but recommended)
  - [ ] API monitoring and logging enabled

- [ ] **Performance**
  - [ ] MongoDB indexes created for frequently queried fields
  - [ ] Connection pooling configured
  - [ ] Timeout values reviewed and adjusted
  - [ ] Log level set to WARNING or ERROR (not INFO/DEBUG)

- [ ] **Testing**
  - [ ] All API endpoints tested with production-like data
  - [ ] Load testing completed
  - [ ] Error handling verified
  - [ ] Database backup strategy in place

### Frontend Configuration

- [ ] **Environment Variables**
  - [ ] `REACT_APP_BACKEND_URL` points to production backend URL
  - [ ] `ENABLE_HEALTH_CHECK` set to false
  - [ ] Remove development-only settings

- [ ] **Build & Optimization**
  - [ ] Production build created: `npm run build`
  - [ ] Build output verified and tested
  - [ ] Static assets optimized (images, fonts, etc.)
  - [ ] Source maps reviewed (remove if sensitive)

- [ ] **Security**
  - [ ] No API tokens or credentials in frontend code
  - [ ] CSP (Content Security Policy) headers configured
  - [ ] HTTPS enforced
  - [ ] Security headers configured (HSTS, X-Frame-Options, etc.)

### Infrastructure

- [ ] **SSL/TLS Certificates**
  - [ ] SSL certificate obtained (Let's Encrypt, commercial CA, etc.)
  - [ ] Certificate auto-renewal configured
  - [ ] HTTPS redirect from HTTP configured

- [ ] **Reverse Proxy** (nginx, Apache, etc.)
  - [ ] Reverse proxy configured for backend
  - [ ] Static file serving configured for frontend
  - [ ] Gzip compression enabled
  - [ ] Request size limits configured

- [ ] **Monitoring**
  - [ ] Application monitoring configured (uptime, errors, performance)
  - [ ] Database monitoring configured
  - [ ] Alert notifications set up
  - [ ] Log aggregation configured (optional)

- [ ] **Backup & Recovery**
  - [ ] MongoDB backup schedule configured
  - [ ] Backup restoration process tested
  - [ ] Application code backed up in git repository
  - [ ] Disaster recovery plan documented

## Deployment Steps

### Option 1: VPS/Cloud VM Deployment (AWS EC2, DigitalOcean, etc.)

#### Backend Deployment

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Clone repository
git clone <repository-url>
cd jiranew-nok/backend

# 3. Install Python and dependencies
sudo apt update
sudo apt install python3.10 python3-pip python3-venv -y

# 4. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 5. Install dependencies
pip install -r requirements.txt

# 6. Install production server
pip install gunicorn

# 7. Set environment variables (don't use .env in production)
export MONGO_URL="mongodb://user:password@mongodb-server:27017"
export DB_NAME="jira_reports"
export CORS_ORIGINS="https://your-frontend.com"

# 8. Test the application
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# 9. Create systemd service for auto-start
sudo nano /etc/systemd/system/jira-backend.service
```

**systemd service file** (`/etc/systemd/system/jira-backend.service`):
```ini
[Unit]
Description=Jira Report Maker Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/jiranew-nok/backend
Environment="MONGO_URL=mongodb://user:pass@host:27017"
Environment="DB_NAME=jira_reports"
Environment="CORS_ORIGINS=https://your-frontend.com"
ExecStart=/path/to/jiranew-nok/backend/venv/bin/gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start and enable service
sudo systemctl start jira-backend
sudo systemctl enable jira-backend
sudo systemctl status jira-backend
```

#### Frontend Deployment

```bash
# 1. Build frontend locally or on server
cd frontend
npm install
REACT_APP_BACKEND_URL=https://api.your-domain.com npm run build

# 2. Upload build folder to server
scp -r build/ user@your-server.com:/var/www/jira-frontend/

# 3. Configure nginx to serve frontend
sudo nano /etc/nginx/sites-available/jira-frontend
```

**nginx configuration** (`/etc/nginx/sites-available/jira-frontend`):
```nginx
server {
    listen 80;
    server_name your-frontend.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-frontend.com;

    ssl_certificate /etc/letsencrypt/live/your-frontend.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-frontend.com/privkey.pem;

    root /var/www/jira-frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Backend API nginx proxy** (`/etc/nginx/sites-available/jira-backend`):
```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable sites and reload nginx
sudo ln -s /etc/nginx/sites-available/jira-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/jira-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Docker Deployment

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

EXPOSE 8000

CMD ["gunicorn", "server:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - jira-network

  backend:
    build: ./backend
    environment:
      MONGO_URL: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017
      DB_NAME: jira_reports
      CORS_ORIGINS: https://your-frontend.com
    depends_on:
      - mongodb
    networks:
      - jira-network

  frontend:
    build:
      context: ./frontend
      args:
        REACT_APP_BACKEND_URL: https://api.your-domain.com
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - jira-network

volumes:
  mongodb_data:

networks:
  jira-network:
    driver: bridge
```

### Option 3: Platform-as-a-Service (Heroku, Render, Railway)

#### Heroku Example

**Backend** (`backend/Procfile`):
```
web: gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

```bash
# Deploy backend
cd backend
heroku create jira-backend
heroku addons:create mongolab
heroku config:set CORS_ORIGINS=https://jira-frontend.herokuapp.com
git push heroku main

# Deploy frontend
cd frontend
heroku create jira-frontend
heroku config:set REACT_APP_BACKEND_URL=https://jira-backend.herokuapp.com
heroku buildpacks:set mars/create-react-app
git push heroku main
```

## Post-Deployment Verification

- [ ] Frontend loads correctly
- [ ] Backend health check responds
- [ ] Can connect to Jira
- [ ] Can fetch issues
- [ ] Charts render correctly
- [ ] PDF export works
- [ ] All filters work
- [ ] HTTPS works correctly
- [ ] No console errors
- [ ] Performance is acceptable

## Monitoring & Maintenance

### Set up monitoring for:
- Application uptime
- API response times
- Error rates
- Database performance
- Disk space usage
- SSL certificate expiration

### Regular maintenance tasks:
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review and optimize database indices
- [ ] Quarterly: Security audit
- [ ] Quarterly: Performance optimization review

## Rollback Plan

If deployment fails:
1. Revert to previous git commit
2. Restore database backup if needed
3. Restart services
4. Verify application works
5. Investigate and fix issues before re-deploying

## Support

For deployment issues:
- Review application logs
- Check nginx/apache error logs
- Verify environment variables
- Test backend API directly with curl/Postman
- Check database connectivity

---

**Remember**: Always test deployment process in a staging environment first!
