FROM node:latest

WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .
RUN npm run bundle

CMD ["npm", "run", "start"]
EXPOSE 3000
EXPOSE 9000
