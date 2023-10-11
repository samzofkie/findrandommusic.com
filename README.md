# The Spotify Game

Create the container images:
```
docker build -t spotify-game .
docker build -t spotify-game-crawler crawler
```
Run everything with `docker compose up`, then open [http://localhost:3000/](http://localhost:3000).

You can bundle the frontend with:
```
npm run bundle
```
Or if everything is up and running, run the frontend dev server with:
```
docker exec spotify-game-app-1 npx webpack serve
```
and view it at [http://localhost:9000](http://localhost:9000).
