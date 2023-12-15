const https = require("node:https");
const fs = require("node:fs");
const redis = require("redis");

const GibberishGenerator = require("./gibberish.js");
//const { getAccessToken } = require("./accessToken.js");
const AccessTokenManager = require("./accessTokenManager.js");
const genrePlaylists = require("./shared/genres.json");
const { haveFilterParamsChanged } = require("./shared/filterParams.js");

function initializeRedisClient() {
  const client = redis.createClient({
    url: "redis://redis",
  });
  client.on("error", (err) => console.log("Redis Client Error", err));
  client.connect();
  return client;
}

class HTTPS429Error extends Error {}

function requestSpotify(accessToken, path) {
  console.log("Requesting " + path);

  const options = {
    hostname: "api.spotify.com",
    port: 443,
    path: path,
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  function makeRequest(resolve, reject) {
    function handleResponse(response) {
      if (response.statusCode === 429) {
        reject(new HTTPS429Error());
      } else {
        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => resolve(JSON.parse(data)));
      }
    }
    const req = https.request(options, handleResponse);
    req.on("error", (err) => reject(err));
    req.end();
  }

  return new Promise(makeRequest);
}

function buildSpotifySearchQueryString(user, gg) {
  let q = gg.generate(4);
  if (user.hasOwnProperty("genres")) q += ` genre:${user.genres}`;
  if (user.hasOwnProperty("dateStart"))
    q += ` year:${user.dateStart}-${user.dateEnd}`;
  return new URLSearchParams({ type: "track", limit: 50, q: q }).toString();
}

/* pickNSongs recieves an array items of objects representing songs, and 
   and chooses n of them, guaranteed to not choose more than one song by a
   single artist. */
function pickNSongs(items, n) {
  /* artistNames is an array of each of the leading artists names, with no 
     duplicates. */
  let artistNames = Array.from(
    new Set(items.map((item) => item.artists[0].name)),
  );

  /* artistsMap maps each artistName to an array of all the songs in items
     for which they are the first artist listed. */
  let artistsMap = new Map(
    artistNames.map((name) => [
      name,
      items.filter((item) => item.artists[0].name === name),
    ]),
  );

  let chosenSongs = [];
  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  for (let i = 0; i < Math.min(n, artistNames.length); i++) {
    // Chose a random artist
    let randomArtist = randomChoice(artistNames);
    // Push a random one of their songs to chosenSongs
    chosenSongs.push(randomChoice(artistsMap.get(randomArtist)));
    // Remove them from artistNames
    artistNames = artistNames.filter((artist) => artist !== randomArtist);
  }
  return chosenSongs;
}

/* lookupGenres takes the object userSongs, extracts all the artists' IDs from
   all the songs, requests Spotify's /v1/artists endpoint to get the 'genre'
   attribute for each artist, and then adds a 'genres' property to each song
   object in userSongs, and returns the modified userSongs. */
async function lookupGenres(accessToken, userSongs) {
  let ids = Object.values(userSongs)
    .flat()
    .map((song) => song.artists)
    .flat()
    .map((artist) => artist.id);
  ids = [...new Set(ids)];

  const artistsData = (
    await requestSpotify(accessToken, "/v1/artists?ids=" + ids.join(","))
  ).artists;

  /* For each song in all of userSongs, create an empty array for the genres
     property, and for each artist in that song, append the genres of that
     artist from artistsData to that song's genres array. */
  for (let songs of Object.values(userSongs))
    for (let song of songs) {
      song.genres = [];
      for (let artist of song.artists) {
        let genres = artistsData.find(
          (artistsDatum) => artistsDatum.id === artist.id,
        ).genres;
        genres = genres.map((genre) => ({
          name: genre,
          url: "https://open.spotify.com/playlist/" + genrePlaylists[genre],
        }));
        song.genres = song.genres.concat(genres);
      }
    }

  return userSongs;
}

function formatSongData(song) {
  return {
    id: song.id,
    artwork_url: song.album.images["0"].url,
    playback_url: song.preview_url,
    release_date: song.album.release_date,
    popularity: song.popularity,
    track: {
      name: song.name,
      url: song.external_urls.spotify,
    },
    artists: song.artists.map((artist) => ({
      name: artist.name,
      url: artist.external_urls.spotify,
      id: artist.id,
    })),
    album: {
      name: song.album.name,
      url: song.album.external_urls.spotify,
    },
    genres: song.genres.map((genre) => ({
      name: genre.name,
      url: genre.url,
    })),
  };
}

async function pushSongsToRedisCache(redisClient, user, songs) {
  for (let song of songs) await redisClient.sAdd(user, JSON.stringify(song));
  console.log(`Pushed ${songs.length} songs to ${user}.`);
}

function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 100));
}

async function start() {
  const redisClient = initializeRedisClient();
  const gibberishGenerator = new GibberishGenerator();
  const accessTokenManager = new AccessTokenManager();

  while (true) {
    try {
      let users = [
        ...Object.values(await redisClient.HGETALL("users")).map((string) =>
          JSON.parse(string),
        ),
        {
          id: "songs",
          mostRecentRequest: new Date().toString(),
          maxCacheSize: 500,
        },
      ];

      // Remove expired users
      function userIsExpired(user) {
        return (new Date() - new Date(user.mostRecentRequest)) / 60000 > 10;
      }

      for (let user of users)
        if (userIsExpired(user)) {
          await redisClient.HDEL("users", user.id);
          await redisClient.DEL(user.id);
        }

      users = users.filter((user) => !userIsExpired(user));

      // Remove users whose Redis sets have more songs than maxCacheSize
      users = (
        await Promise.all(
          users.map(async (user) => ({
            ...user,
            currentNumSongs: await redisClient.SCARD(user.id),
          })),
        )
      ).filter((user) => user.currentNumSongs < user.maxCacheSize);

      if (users.length > 0) {
        const accessToken = await accessTokenManager.get();

        // Search for songs for each user, that match their parameters
        let userSongs = Object.fromEntries(
          await Promise.all(
            users.map(async (user) => {
              const searchQueryString = buildSpotifySearchQueryString(
                user,
                gibberishGenerator,
              );
              const results = await requestSpotify(
                accessToken,
                "/v1/search/?" + searchQueryString,
              );
              const songs = pickNSongs(results.tracks.items, 5);
              return [user.id, songs];
            }),
          ),
        );

        // TODO: if no songs come up, dont request artists

        // Add genre data to each song
        userSongs = await lookupGenres(accessToken, userSongs);

        // Format song data
        userSongs = Object.fromEntries(
          Object.keys(userSongs).map((user) => [
            user,
            userSongs[user].map((song) => formatSongData(song)),
          ]),
        );

        // TODO comment this
        for (let user of Object.keys(userSongs)) {
          console.log(user);

          const justUsedFilterParams = users.find((u) => u.id === user);
          const currentFilterParams = JSON.parse(
            await redisClient.HGET("users", user),
          );

          // TODO: This should use proper locking
          if (
            user === "songs" ||
            !haveFilterParamsChanged(justUsedFilterParams, currentFilterParams)
          )
            await pushSongsToRedisCache(redisClient, user, userSongs[user]);
        }
      }
    } catch (error) {
      if (error instanceof HTTPS429Error) {
        console.error("Got a 429!");
        await sleep(100);
      } else throw error;
    }

    await sleep(1);
  }
}

start();
