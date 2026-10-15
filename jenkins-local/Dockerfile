FROM jenkins/jenkins:lts-jdk17

USER root

# Install Docker CLI + Compose v2 plugin inside the Jenkins container.
# The Docker daemon will be the host daemon via /var/run/docker.sock.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg lsb-release \
  && install -m 0755 -d /etc/apt/keyrings \
  && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
  && chmod a+r /etc/apt/keyrings/docker.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
    > /etc/apt/sources.list.d/docker.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin docker-buildx-plugin \
  && rm -rf /var/lib/apt/lists/*

# Add Jenkins user to a docker group that matches the host docker.sock group id.
# Pass DOCKER_GID at build time if needed (Linux hosts commonly use 998/999; varies).
ARG DOCKER_GID=999
RUN groupadd -g "${DOCKER_GID}" docker || true \
  && usermod -aG docker jenkins

USER jenkins
