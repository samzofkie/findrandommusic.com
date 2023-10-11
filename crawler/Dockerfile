FROM node:latest
RUN apt-get update && apt-get -y upgrade

WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .
CMD ["node", "daemon.js"]
