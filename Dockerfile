# syntax=docker/dockerfile:1

FROM node
WORKDIR /app
COPY . .
RUN apt-get update && apt-get -y upgrade
CMD ["node", "app.js"]
EXPOSE 3000
