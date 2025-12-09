# CI/CD pipeline

Branches and targets:
- `develop` / `release` -> staging, uses `.env.dev` + `docker-compose.dev.yml`.
- `main` -> production, uses `.env.prod` + `docker-compose.prod.yml`.

Workflow (.github/workflows/ci-cd.yml):
- Builds both projects on every push to the three branches (npm ci, lint/test if present, build).
- On `develop` or `release`, SSH to the staging VPS and runs `scripts/ci-deploy.sh staging <branch>`.
- On `main`, SSH to the prod VPS and runs `scripts/ci-deploy.sh prod <branch>`.

Secrets to add in the repository:
- Staging: `STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY` (private key), `STAGING_SSH_PORT` (optional), `STAGING_REMOTE_PATH` (path to the repo on the VPS).
- Prod: `PROD_SSH_HOST`, `PROD_SSH_USER`, `PROD_SSH_KEY`, `PROD_SSH_PORT` (optional), `PROD_REMOTE_PATH`.

Prepare the VPS (staging and prod):
1) Install Docker + Docker Compose v2 and git.  
2) Clone this repository in `STAGING_REMOTE_PATH` / `PROD_REMOTE_PATH`.  
3) Create `.env.dev` and `.env.prod` on the server (not tracked) with the right credentials/URLs.  
4) Ensure the VPS has access to the ports you need (or a reverse proxy in front).

Manual deploy (SSH):
```bash
cd /path/to/repo
bash scripts/ci-deploy.sh staging develop   # or prod main
```
