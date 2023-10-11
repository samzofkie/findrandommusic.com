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
