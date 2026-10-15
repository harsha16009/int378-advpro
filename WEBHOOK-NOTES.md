# Webhook notes (GitHub → Local Jenkins)

If Jenkins is running on your laptop (localhost), GitHub webhooks will **not** reach it unless you expose Jenkins with a public URL (tunnel).

## Recommended (simplest): Multibranch Pipeline + Jenkinsfile in the repo

1. Fork `harsha16009/demo-micro` to your GitHub account.
2. Add a `Jenkinsfile` at the repo root.
3. In Jenkins create a **Multibranch Pipeline** job that points to your fork.
4. Expose Jenkins with a tunnel and set a webhook to `https://<public-url>/github-webhook/`.

## Alternative: Pipeline job with inline script

If you keep the pipeline script inside Jenkins UI (not in the Git repo), GitHub’s “GitHub hook trigger for GITScm polling” usually won’t apply because the job has no SCM configured.

If you want “webhook → build” without adding a Jenkinsfile to the repo, install **Generic Webhook Trigger** plugin and trigger the job from a webhook URL Jenkins provides.
