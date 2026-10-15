# CI/CD Setup (GitHub Actions + Jenkins)

This guide assumes your repo is pushed to GitHub as:

- `https://github.com/harsha16009/microservices-demo`

## 1) Push this project to GitHub

Run these from `fruits-delivery-demo`:

```powershell
git add -A
git commit -m "Setup monitoring + CI/CD"

git remote set-url origin https://github.com/harsha16009/microservices-demo.git
git branch -M main
git push -u origin main
```

If you don’t have `origin` yet, use:

```powershell
git remote add origin https://github.com/harsha16009/microservices-demo.git
```

## 2) GitHub Actions: deploy Frontend to GitHub Pages (live link)

This repo includes a GitHub Pages workflow:

- `.github/workflows/pages-frontend.yml`

After your first push to `main`:

1. GitHub repo → **Settings → Pages**
2. **Build and deployment**
   - Source: **GitHub Actions**
3. Save

Your live link becomes:

- `https://harsha16009.github.io/microservices-demo/`

## 3) Jenkins (local) pipeline on `http://localhost:8080`

### 3.1 Run Jenkins in Docker (recommended on Windows)

From `fruits-delivery-demo/jenkins-docker`:

```powershell
docker compose up -d --build
```

Open Jenkins:

- `http://localhost:8080`

If you changed `jenkins-docker/Dockerfile`, rebuild Jenkins:

```powershell
docker compose down
docker compose build --no-cache
docker compose up -d --build --force-recreate
```

Quick verification (inside the Jenkins container):

```powershell
docker exec -it fruits-jenkins docker --version
docker exec -it fruits-jenkins docker compose version
docker exec -it fruits-jenkins docker-compose --version
```

### 3.2 Create a Pipeline job

1. Jenkins → **New Item** → **Pipeline**
2. **Build Triggers**: ✅ *GitHub hook trigger for GITScm polling*
3. **Pipeline**:
   - Definition: *Pipeline script from SCM*
   - SCM: *Git*
   - Repo URL: `https://github.com/harsha16009/microservices-demo.git`
   - Branch: `*/main`
   - Script path:
     - If `Jenkinsfile` is in the repo root: `Jenkinsfile`
     - If the repo contains the project inside a folder (example `fruits-delivery-demo/`): `fruits-delivery-demo/Jenkinsfile`

### 3.3 GitHub webhook → Jenkins (localhost needs a tunnel)

GitHub cannot call `localhost`, so create a public URL:

```powershell
ngrok http 8080
```

Then in GitHub repo → **Settings → Webhooks → Add webhook**:

- Payload URL: `https://<your-ngrok>.ngrok-free.app/github-webhook/`
- Content type: `application/json`
- Events: **Just the push event**
- Active: ✅

Now every `git push` to `main` triggers the Jenkins pipeline.
