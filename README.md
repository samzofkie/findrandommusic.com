# The Spotify Game

Create the container images:
```
docker build -t spotify-game .
docker build -t spotify-game-crawler crawler
docker build -t spotify-game-rproxy proxy
```
Run everything with `docker compose up`, then open [http://localhost/](http://localhost/).

You can bundle the frontend with:
```
npm run bundle
```
Or if everything is up and running, run the frontend dev server with:
```
docker exec spotify-game-app-1 npx webpack serve
```
and view it at [http://localhost:9000](http://localhost:9000).

For now, the `date-formatter.js` file in the root directory needs to by copied into the `crawler` directory on changes (see [this discussion](https://github.com/auxilincom/docker-compose-starter/issues/3)).
