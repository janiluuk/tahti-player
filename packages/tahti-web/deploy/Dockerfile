# SPDX-License-Identifier: AGPL-3.0-or-later
# Serve @tahti-player/tahti-web dist with /tahti-api → https://api.tahti.live

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
