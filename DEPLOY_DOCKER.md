# Deploy Backoffice With Docker

## 1. Prepare environment

Create `.env.prod` from the example:

```bash
cp .env.prod.example .env.prod
```

Minimal VPS configuration when the backend is exposed on the same host port `8080`:

```env
BACKOFFICE_IMAGE=neutrino-backoffice:latest
BACKOFFICE_PORT=3000
BACKEND_API_BASE_URL=http://host.docker.internal:8080/api/v1
NEXT_PUBLIC_API_BASE_URL=http://host.docker.internal:8080/api/v1
BACKOFFICE_DEFAULT_TENANT_ID=11111111-1111-1111-1111-111111111111
```

If the backend is exposed behind a domain, prefer:

```env
BACKEND_API_BASE_URL=https://api.example.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1
```

## 2. Build and run

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Check status:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backoffice
```

The app listens on:

```text
http://SERVER_IP:3000
```

## 3. Nginx reverse proxy example

```nginx
server {
    listen 80;
    server_name backoffice.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. Production notes

- Use HTTPS in front of the backoffice.
- Keep `BACKEND_API_BASE_URL` reachable from inside the Docker container.
- Keep backend CORS configured to allow the backoffice public domain.
- Do not commit `.env.prod`.

## 5. GitHub Actions CI/CD

The workflow `.github/workflows/ci-cd.yml` builds the Next.js app, pushes a Docker image to GHCR, copies `docker-compose.prod.yml` to the VPS, then deploys the stack.

Required GitHub repository secrets:

```text
VPS_HOST=213.32.20
VPS_USER=
VPS_PORT=
VPS_SSH_KEY=<private deploy key>
VPS_BACKOFFICE_DIR
```

Optional secrets:

```text
GHCR_USERNAME
GHCR_TOKEN
```

Optional GitHub repository variables:

```text
BACKEND_API_BASE_URL
NEXT_PUBLIC_API_BASE_URL
BACKOFFICE_DEFAULT_TENANT_ID
```

On the VPS, `VPS_BACKOFFICE_DIR` does not need to be a Git repository. It only needs a `.env.prod` file. The workflow creates the directory if needed and synchronizes `docker-compose.prod.yml` on each deployment.

Example:

```bash
mkdir -p /opt/neutrinopay-backoffice
cd /opt/neutrinopay-backoffice
nano .env.prod
```

If GitHub Actions returns `Too many authentication failures`, the workflow forces:

```text
BatchMode=yes
IdentitiesOnly=yes
PreferredAuthentications=publickey
```

Because the private key is sensitive, rotate it if it has been exposed:

```bash
ssh-keygen -t ed25519 -C "backoffice-github-actions" -f ~/.ssh/backoffice_github_actions
cat ~/.ssh/backoffice_github_actions.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Then replace the GitHub secret `VPS_SSH_KEY` with the content of `~/.ssh/backoffice_github_actions`.
