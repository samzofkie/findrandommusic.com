# syntax=docker/dockerfile:1

FROM node
WORKDIR /app
RUN apt-get update && apt-get -y upgrade
COPY . .
CMD ["npm", "run", "start"]
EXPOSE 3000
