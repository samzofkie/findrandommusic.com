var express = require("express");
var path = require("path");
var morgan = require("morgan");
const { createClient } = require("redis");
const { rateLimit } = require("express-rate-limit");

const genrePlaylists = require("./shared/genres.json");
const { meaningfulFilterParams, haveFilterParamsChanged } = require('./shared/filterParams.js');

const SERVE_STATIC = process.argv[2] === "--serve-static=true";

const redisClient = createClient({
  url: "redis://redis",
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect();

const app = express();

app.use(
  morgan(function (tokens, req, res) {
    return [
      tokens.date(req, res),
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens["response-time"](req, res) + "ms",
      tokens["remote-addr"](req, res),
      tokens["user-agent"](req, res),
    ].join(" ");
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  "/songs",
  rateLimit({
    windowMs: 1000,
    max: 2,
  }),
);

async function popNSongsFromSet(nSongs, setName) {
  /* let songs = [];
  for (let i=0; i<nSongs; i++)
    songs.push(await redisClient.sPop(setName));
  return songs; */

  return await Promise.all(
    [...new Array(nSongs).keys()].map(
      async (i) => await redisClient.sPop(setName),
    ),
  );
}

// TODO:
// Validate input-- dates out of bounds, popularity values out of bounds, genres that don't exist
// Error handling for popNSongsFrom()
app.get("/songs", async (req, res) => {
  /* If none of the meaningfulFilterParams are set, just return songs from the 
     generic 'songs' set." */
  if (!meaningfulFilterParams.some((name) => req.query.hasOwnProperty(name))) {
    res.send(await popNSongsFromSet(10, "songs"));
    return;
  }

  /* Return a 400 if the user hasn't given us an ID. */
  if (!req.query.hasOwnProperty("id")) {
    res
      .status(400)
      .send(
        "Can't accept filter parameters without an id field in the query string!",
      );
    return;
  }

  req.query.mostRecentRequest = new Date().toString();

  async function pushUserParamsToRedis() {
    await redisClient.HSET("users", req.query.id, JSON.stringify(req.query));
  }

  /* See README! */
  const userSeenBefore = (await redisClient.HKEYS("users")).includes(
    req.query.id,
  );
  if (userSeenBefore) {
    if (
      haveFilterParamsChanged(
        JSON.parse(await redisClient.HGET("users", req.query.id)),
        req.query,
      )
    ) {
      await pushUserParamsToRedis();
      await redisClient.DEL(req.query.id);
    }
  } else {
    await pushUserParamsToRedis();
  }

  while (await redisClient.SCARD(req.query.id) < 10) ;

  res.send(await popNSongsFromSet(10, req.query.id));

  //res.status(404).send("sowwy aint implemented yet");
});

app.get("/genre-list", async (req, res) => {
  res.send(Object.keys(genrePlaylists));
});

if (SERVE_STATIC) app.use(express.static("public"));

const port = 3000;

app.listen(port, () => {
  console.log(`app.js listening on port ${port}`);
  if (SERVE_STATIC) console.log("serving static files from 'public' dir");
});
