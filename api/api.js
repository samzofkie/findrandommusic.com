var express = require("express");
var path = require("path");
var morgan = require("morgan");
const { createClient } = require("redis");
const { rateLimit } = require("express-rate-limit");

const genrePlaylists = require("./shared/genres.json");
const {
  meaningfulFilterParams,
  haveFilterParamsChanged,
} = require("./shared/filterParams.js");

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
  return await Promise.all(
    [...new Array(nSongs).keys()].map(
      async (i) => await redisClient.sPop(setName),
    ),
  );
}

function requestHasMeaningfulParamsSet(req) {
  return meaningfulFilterParams.some((name) => req.query.hasOwnProperty(name));
}

// TODO:
// Validate input-- dates out of bounds, popularity values out of bounds, genres that don't exist
// Error handling for popNSongsFrom()
app.get("/songs", async (req, res) => {
  /* If none of the meaningfulFilterParams are set, just return songs from the 
     generic 'songs' set." */

  if (!requestHasMeaningfulParamsSet(req)) {
    res.send(await popNSongsFromSet(10, "songs"));
    return;
  }

  const userSeenBefore = (await redisClient.HKEYS("users")).includes(
    req.query.id,
  );

  /* Return a 400 if the user hasn't given us an ID. */
  if (!req.query.hasOwnProperty("id")) {
    res
      .status(400)
      .send(
        "Can't accept filter parameters without an id field in the query string!",
      );
    return;

    /* If the request has an ID, has no meaningful filter parameters set, and 
     has been seen before, delete them from Redis so the crawler stops wasting
     time. */
  } else if (!requestHasMeaningfulParamsSet(req) && userSeenBefore) {
    redisClient.HDEL("users", req.query.id);
    redisClient.DEL(req.query.id);
  }

  req.query.mostRecentRequest = new Date().toString();
  req.query.maxCacheSize = 50;
  req.query.searchTermLength = 5;

  async function pushUserParamsToRedis() {
    await redisClient.HSET("users", req.query.id, JSON.stringify(req.query));
  }

  /* See README! */
  if (userSeenBefore) {
    if (
      haveFilterParamsChanged(
        JSON.parse(await redisClient.HGET("users", req.query.id)),
        req.query,
      )
    ) {
      await redisClient.DEL(req.query.id);
      await pushUserParamsToRedis();
    }
  } else {
    await pushUserParamsToRedis();
  }

  const startTime = new Date();
  while ((await redisClient.SCARD(req.query.id)) < 10)
    if ((new Date() - startTime) / 1000 > 60) {
      res
        .status(500)
        .send(
          "It's taking a really long time to find results, maybe different filter settings :/ sorry.",
        );
      redisClient.HDEL("users", req.query.id);
      redisClient.DEL(req.query.id);
      return;
    }
  res.send(await popNSongsFromSet(10, req.query.id));
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
