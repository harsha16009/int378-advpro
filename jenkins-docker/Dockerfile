FROM jenkins/jenkins:lts

USER root

# Install curl and required packages
RUN apt-get update && \
    apt-get install -y curl gnupg2 git ca-certificates

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install Docker CLI
RUN apt-get install -y docker.io

# Install Docker Compose (standalone) to guarantee availability inside Jenkins agent
# (Some base images/repos don't ship the v2 plugin packages.)
ARG DOCKER_COMPOSE_VERSION=v2.29.2
RUN mkdir -p /usr/local/lib/docker/cli-plugins && \
    curl -fsSL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose && \
    ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

USER jenkins
