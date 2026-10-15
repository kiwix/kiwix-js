# Docker troubleshooting

## Container status and logs

Use the official Docker documentation for checking [container status](https://docs.docker.com/reference/cli/docker/container/ls/) and viewing [container logs](https://docs.docker.com/reference/cli/docker/container/logs/).

The `kiwix-js` container runs Nginx to serve static files. `docker compose logs kiwix-js` shows Nginx startup notices and HTTP access/error lines, not application errors. Check the browser's DevTools console for application errors.

For host port changes, see the [Docker instructions in the main README](../README.md#self-hosting-with-docker) and [`docker-compose.yml`](../docker-compose.yml).

## Restricted mode over a LAN

When accessed from another machine over plain HTTP (for example, `http://192.168.x.x:8080`), browsers do not enable Service Workers for that origin. Kiwix JS therefore falls back to Restricted mode. Serve it over HTTPS, for example through a reverse proxy, if intranet users need more than Wikipedia and static sites.

## Offline access

The server root redirects to `/current/www/index.html`, which is outside the Service Worker's scope and will not work offline. Bookmark or install the PWA from `/current/www/index.html` instead. See the redirect in [`index.nginx.html`](index.nginx.html).

## Updates show an old version

The `latest` image tag is not pulled automatically. From the repository directory, run `docker compose pull && docker compose up -d`. When Service Workers are available (on localhost or over HTTPS), close and relaunch the app to replace the browser's cached copy.

## ZIM archives

ZIM files cannot be supplied by mounting a volume into this container. Select them through the browser's file picker on the machine running the browser, or use a network share.See the [ZIM archive note in the main README](../README.md#self-hosting-with-docker).

## Supported platform

The published image currently supports `linux/amd64` only; ARM hosts are not supported by this image.
