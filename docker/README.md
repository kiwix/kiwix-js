# Docker troubleshooting

This guide covers common troubleshooting steps for running Kiwix JS with Docker.

## Check whether the container is running

To check whether the Kiwix JS container is running:

```bash
docker ps
```

If it is not listed, check stopped containers:

```bash
docker ps -a
```

## Check container logs

If Kiwix JS does not start correctly or is not available in the browser, inspect the container logs:

```bash
docker logs <container-name>
```

When using Docker Compose, you can view the Kiwix JS service logs with:

```bash
docker compose logs kiwix-js
```

These logs can help identify startup or configuration problems.

## Resolve a host port conflict

The default Docker configuration maps host port `8080` to the container port `80`:

```text
8080:80
```

If host port `8080` is already in use, change the host port while keeping the container port as `80`.

For Docker Compose, change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "8081:80"
```

Then access Kiwix JS at:

```text
http://localhost:8081
```

For a container started directly with `docker run`, use a different host port:

```bash
docker run -d -p 8081:80 ghcr.io/kiwix/kiwix-moz-extension:latest
```

Then access Kiwix JS at:

```text
http://localhost:8081
```
