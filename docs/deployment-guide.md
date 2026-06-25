# Production Deployment Guide

This guide provides a comprehensive step-by-step procedure to deploy the **Car Dealership & Rental Management System** on a fresh VPS running **Ubuntu 24.04 LTS**. It covers initial OS updates, dependency installations, repository configuration, environment configuration, database migration, routing configuration, SSL settings, and service verification.

---

## Table of Contents
1. [Prerequisites & Server Specs](#1-prerequisites--server-specs)
2. [Step 1: Clean OS Installation & SSH Key Access](#step-1-clean-os-installation--ssh-key-access)
3. [Step 2: Install Core System Dependencies](#step-2-install-core-system-dependencies)
4. [Step 3: Setup Directory Structures on Host](#step-3-setup-directory-structures-on-host)
5. [Step 4: Clone the Codebase to VPS](#step-4-clone-the-codebase-to-vps)
6. [Step 5: Configure Production Environment variables](#step-5-configure-production-environment-variables)
7. [Step 6: Database Migration (MongoDB Atlas Setup)](#step-6-database-migration-mongodb-atlas-setup)
8. [Step 7: Launch Containers and Services](#step-7-launch-containers-and-services)
9. [Step 8: Cloudflare & DNS Configuration](#step-8-cloudflare--dns-configuration)
10. [Step 9: Diagnostics and Logs Verification](#step-9-diagnostics-and-logs-verification)

---

## 1. Prerequisites & Server Specs

### Recommended VPS Specs
* **OS:** Ubuntu 24.04 LTS (Noble Numbat)
* **CPU:** 2 vCPU cores or higher
* **Memory (RAM):** 2 GB RAM or higher (recommended to prevent build issues in Next.js)
* **Storage:** 20 GB SSD/NVMe (to accommodate Docker images, local caches, and static media uploads)
* **IP Address:** A public static IPv4 address (e.g., `193.24.208.229`)
* **Domain Name:** A registered domain (e.g., `amyalcar.com`) pointed to the VPS via Cloudflare

### Remote Services Needed
* **Database:** A MongoDB Atlas cluster (M0 or higher tier)
* **Email Provider:** Resend account and API key
* **SMS Provider:** Twilio account SID, auth token, and active phone number

---

## Step 1: Clean OS Installation & SSH Key Access

Ensure your VPS is reinstalled with a minimal installation of **Ubuntu 24.04 LTS**.

### 1. Update SSH Config (Client Side)
Save your private key (e.g., `vpskey.txt` or `id_rsa`) to your local machine, and restrict its file permissions:
```bash
chmod 600 vpskey.txt
```

Verify you can connect to your host as the root user:
```bash
ssh -i vpskey.txt root@<VPS_IP_ADDRESS>
```

### 2. Update System Packages
Run updates on the remote server to ensure all system repositories are up to date:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install Core System Dependencies

The application services are fully containerized using **Docker** and orchestrated using **Docker Compose**. We will install the official Docker Engine and Git.

### 1. Install Docker Engine and Git
Run the following commands on the VPS to set up Docker's official GPG key and repository, and install Docker alongside Git:

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update

# Install Docker packages & Git:
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
```

### 2. Verify Installation
Ensure both Git and Docker services are up and functional:
```bash
docker --version         # Output: Docker version 27.x.x or 29.x.x
docker compose version   # Output: Docker Compose version v2.x.x
git --version            # Output: git version 2.x.x
```

Enable the Docker daemon to start automatically on system boot:
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## Step 3: Setup Directory Structures on Host

Production static files and vehicle document uploads must persist on the host filesystem so that rebuilding or updating application containers will not delete user-uploaded files.

Create the persistent directory on the VPS:
```bash
sudo mkdir -p /var/lib/car-dealership/uploads
sudo chown -R $USER:$USER /var/lib/car-dealership
sudo chmod -R 775 /var/lib/car-dealership
```

---

## Step 4: Clone the Codebase to VPS

To authenticate against a private GitHub repository, you can either configure a GitHub Deploy Key on the VPS or use SSH Agent Forwarding.

### Option: SSH Agent Forwarding (Recommended)
Add your SSH key to your local SSH Agent:
```bash
ssh-add vpskey.txt
```

Connect to the VPS, forwarding your local keys to the SSH session:
```bash
ssh -A root@<VPS_IP_ADDRESS>
```

Clone the repository into `/app/car-dealership` on the remote server:
```bash
git clone git@github.com:amnahid/car-dealership.git /app/car-dealership
cd /app/car-dealership
```

---

## Step 5: Configure Production Environment Variables

Generate a secure production environment configuration. 

Create a `.env.production` file at `/app/car-dealership/.env.production`:
```bash
nano /app/car-dealership/.env.production
```

Copy and populate the template below. Replace placeholders with actual credentials and cryptographically secure secrets:

```env
# Database Configuration (MongoDB Atlas Cluster)
# Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/car_dealership?appName=Cluster0
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster_domain>/car_dealership?appName=Cluster0

# Authentication Secrets
# Generate random 32-byte Base64 strings using: openssl rand -base64 32
JWT_SECRET=your_secure_random_base64_jwt_secret
NEXTAUTH_SECRET=your_secure_random_base64_nextauth_secret
NEXTAUTH_URL=https://amyalcar.com

# Frontend Application Configurations
NEXT_PUBLIC_APP_URL=https://amyalcar.com
NEXT_PUBLIC_APP_NAME="Amyal Car"

# Email Alerts Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@businessgrowthstudio.online
RESEND_FROM_NAME="Amyal Car Dealership"
RESEND_ADMIN_EMAIL=admin@dealership.com

# SMS Alerts Configuration (Twilio)
TWILIO_ACCOUNT_SID=ACyour_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_ADMIN_PHONE=+1234567890

# Secure Cron API Authentication Key
# Generate random secret using: openssl rand -base64 32
CRON_API_KEY=your_secure_random_base64_cron_secret
```

---

## Step 6: Database Migration (MongoDB Atlas Setup)

If you are migrating or cloning records from a source database (e.g., `test`) to your target production database (`car_dealership`) on MongoDB Atlas, follow this procedure.

> [!NOTE]
> MongoDB database names are specified in the `/database_name` section of the MongoDB URI path. Ensure target paths are correct during restoration.

### 1. Extract Data from Source Database
Use `mongodump` to generate a compressed archive of the source database schema and records.
```bash
# Dump the source 'test' database to a file
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.4acsjko.mongodb.net/test" --archive="/tmp/test_db.archive"
```

### 2. Restore and Map to Production Namespace
Use `mongorestore` to load and rewrite the collections directly into your target `car_dealership` namespace. 
```bash
# Restore to 'car_dealership' using the root cluster connection string
mongorestore --uri="mongodb+srv://<username>:<password>@cluster0.4acsjko.mongodb.net/?appName=Cluster0" \
  --archive="/tmp/test_db.archive" \
  --nsFrom="test.*" \
  --nsTo="car_dealership.*" \
  --drop
```
*Note: The `--drop` option replaces existing collections in target `car_dealership` namespace with the restored backups.*

---

## Step 7: Launch Containers and Services

Our `docker-compose.yml` configures three production services linked on a virtual bridge network:
1. **`app`**: The Next.js Next SSR server listening internally on port `4000`.
2. **`nginx`**: Handles routing static uploads directly from host volumes and proxying other traffic, listening on port `81`.
3. **`caddy`**: Exposes port `80` and `443` to the internet, routes to Nginx, and manages auto-renewing Let's Encrypt certificates.

### 1. Review configurations
* **`Caddyfile`**:
  ```caddy
  amyalcar.com {
      reverse_proxy nginx:81
  }
  http://193.24.208.229 {
      reverse_proxy nginx:81
  }
  ```
  *(Let's Encrypt doesn't issue SSL certificates for raw IP addresses, so we enforce plain HTTP for the IP and HTTPS for the domain)*

* **`nginx/nginx.conf`**:
  ```nginx
  server {
      listen 81;
      server_name _;
      location /uploads/ {
          alias /app/public/uploads/;
          expires 30d;
      }
      location / {
          proxy_pass http://app:4000;
          # standard headers for headers forwarded from caddy...
      }
  }
  ```

### 2. Build and Start Services
Navigate to the root directory `/app/car-dealership` and run:
```bash
docker compose up --build -d
```

Docker Compose will build the Next.js multi-stage production image, prepare static files, and start all containers.

---

## Step 8: Cloudflare & DNS Configuration

Ensure your DNS configurations are properly aligned so that Caddy can challenge and acquire Let's Encrypt SSL certificates.

1. **DNS A Record:** 
   Point the root domain `amyalcar.com` (and optionally subdomains like `www.amyalcar.com`) to the VPS IP `193.24.208.229`.
2. **Cloudflare Proxy Settings:**
   - If using Cloudflare proxy (Proxy status: **Orange Cloud**), Cloudflare handles SSL certificate termination. Set your Cloudflare SSL/TLS encryption mode to **Full** (or **Full (strict)**) to ensure Cloudflare encrypts the communication with Caddy.
   - If bypassing Cloudflare proxy (Proxy status: **DNS Only / Grey Cloud**), Caddy will negotiate Let's Encrypt certificates directly with incoming requests.

---

## Step 9: Diagnostics and Logs Verification

Validate that everything is running normally.

### 1. Check Running Containers
Ensure all three containers are reported as healthy and active:
```bash
docker compose ps
```
*Expected Output:*
```
NAME                   IMAGE                COMMAND                  SERVICE   STATUS                   PORTS
car-dealership-app     car-dealership-app   "docker-entrypoint.s…"   app       Up 15 minutes (healthy)   4000/tcp
car-dealership-caddy   caddy:alpine         "caddy run --config …"   caddy     Up 15 minutes             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
car-dealership-nginx   nginx:alpine         "/docker-entrypoint.…"   nginx     Up 15 minutes             0.0.0.0:81->81/tcp
```

### 2. Inspect Application logs
Check stdout/stderr logs of the Next.js service to verify database connection success:
```bash
docker compose logs -f app
```

### 3. Verify Database Connectivity manually
Run a quick database verification from within the application container container:
```bash
docker exec car-dealership-app node -e "
const { MongoClient } = require('mongodb');
MongoClient.connect(process.env.MONGODB_URI)
  .then(client => {
    console.log('Successfully connected to MongoDB Atlas!');
    return client.db().collection('users').countDocuments();
  })
  .then(count => {
    console.log('Database User Count:', count);
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
"
```

### 4. Verify HTTP and HTTPS Routing
Verify redirection headers using curl:
```bash
# Verify raw IP redirection (should return HTTP/1.1 307 Temporary Redirect to /auth/login)
curl -I http://193.24.208.229

# Verify domain redirection (should return HTTP/2 307 to /auth/login)
curl -I https://amyalcar.com
```

---

## Maintenance & Updates Workflow

When pushing updates to production, SSH into the VPS and pull the latest code from GitHub, then rebuild:
```bash
cd /app/car-dealership
git pull origin main
docker compose up --build -d
```
Docker Compose will build the updated code in the background and switch containers with zero downtime once the new container reports as healthy.
