ARG NGINX_IMAGE=nginx:alpine

FROM ${NGINX_IMAGE}

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
