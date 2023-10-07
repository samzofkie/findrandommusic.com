# The Spotify Game

Create the container image:
```
docker build -t spotify-game .
```
Run with:
```
docker run -dp 127.0.0.1:3000:3000 spotify-game
```
Then open [http://localhost:3000/](http://localhost:3000).


Create the frontend bundle with:
```
npm run bundle
```
