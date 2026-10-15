# Jenkins Local (Docker) + GitHub Webhook

This folder runs Jenkins locally (default: `http://localhost:8081`) with Docker CLI + Compose available inside Jenkins, so your `Jenkinsfile` stages that run `docker compose ...` can work. (JNLP agent port is exposed on `50001`.)

## 1) Start Jenkins (Docker)

From this folder:

- `docker compose up -d --build`

Get the initial admin password:

- `docker exec -it jenkins-local cat /var/jenkins_home/secrets/initialAdminPassword`

Then open `http://localhost:8081` and finish the setup wizard.

## 2) Create a Pipeline job (uses the repo Jenkinsfile)

In Jenkins UI:

- **New Item** → **Pipeline** (or **Multibranch Pipeline**)
- For a simple Pipeline job:
  - **Pipeline** → **Definition**: *Pipeline script from SCM*
  - **SCM**: *Git*
  - **Repository URL**: `https://github.com/harsha16009/demo-micro.git`
  - **Branch Specifier**: `*/main`
  - **Script Path**: `Jenkinsfile` (the Jenkinsfile in that GitHub repo)

Click **Build Now**.

## 3) Webhook trigger from GitHub (local Jenkins)

GitHub cannot call `http://localhost:8081` directly. You must expose Jenkins to the internet using a tunnel, then set the webhook URL to:

- `https://<your-public-url>/github-webhook/`

Common options:

- **ngrok**: run `ngrok http 8081` and use the HTTPS forwarding URL
- **Cloudflare Tunnel**: expose `localhost:8080` to a stable hostname

In Jenkins:

- Install plugins: **Git**, **GitHub**, **Pipeline**
- In your job configuration enable: **GitHub hook trigger for GITScm polling**

In GitHub repo settings:

- **Settings** → **Webhooks** → **Add webhook**
- **Payload URL**: `https://<your-public-url>/github-webhook/`
- **Content type**: `application/json`
- **Events**: *Just the push event* (or what you need)

## Notes

- This setup mounts `/var/run/docker.sock` into Jenkins. Only do this on a trusted machine; anyone with Jenkins job execution can control Docker on the host.
- On Docker Desktop (Windows/macOS), `/var/run/docker.sock` is typically `root:root` (mode `660`), so this compose file runs Jenkins as `root` to avoid “permission denied while trying to connect to the docker API”.
- On Linux, prefer setting `DOCKER_GID` in `docker-compose.yml` to match the group id of `/var/run/docker.sock` on the host, and run Jenkins as the `jenkins` user.
