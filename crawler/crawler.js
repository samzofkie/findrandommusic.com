const https = require("node:https");
const fs = require("node:fs");
const redis = require("redis");

const GibberishGenerator = require("./gibberish.js");
const AccessTokenManager = require("./accessTokenManager.js");
const genrePlaylists = require("./shared/genres.json");
const { haveFilterParamsChanged } = require("./shared/filterParams.js");

class HTTPS429Error extends Error {}

module.exports = class Crawler {
  constructor() {
    this.gibberishGenerator = new GibberishGenerator();
    this.accessTokenManager = new AccessTokenManager();
    this.redisClient = this.initializeRedisClient();
    this.userExpirationMinutes = 10;
    this.pickPerSearch = 5;
    this._429TimeoutSeconds = 60;
    this.everyLoopTimeoutSeconds = 1;
  }

  initializeRedisClient() {
    const client = redis.createClient({
      url: "redis://redis",
    });
    client.on("error", (err) => console.log("Redis Client Error", err));
    client.connect();
    return client;
  }

  async sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  userIsExpired(user) {
    return (
      (new Date() - new Date(user.mostRecentRequest)) / (1000 * 60) >
      this.userExpirationMinutes
    );
  }

  async removeExpiredUsers(users) {
    /* Doing async .filter() is not worth the trouble. */
    for (let user of users)
      if (this.userIsExpired(user)) {
        await this.redisClient.HDEL("users", user.id);
        await this.redisClient.DEL(user.id);
      }

    return users.filter((user) => !this.userIsExpired(user));
  }

  async filterFullCacheUsers(users) {
    return (
      await Promise.all(
        users.map(async (user) => {
          if (user.maxCacheSize > (await this.redisClient.SCARD(user.id)))
            return user;
          else return null;
        }),
      )
    ).filter((f) => f);
  }

  async getUsers() {
    let users = [
      ...Object.values(await this.redisClient.HGETALL("users")).map((string) =>
        JSON.parse(string),
      ),
      {
        id: "songs",
        mostRecentRequest: new Date().toString(),
        maxCacheSize: 500,
        searchTermLength: 5,
      },
    ];
    users = await this.removeExpiredUsers(users);
    users = await this.filterFullCacheUsers(users);
    return users;
  }

  buildSearchQueryString(user) {
    let q = this.gibberishGenerator.generate(user.searchTermLength);
    if (user.hasOwnProperty("genres")) q += ` genre:${user.genres}`;
    if (user.hasOwnProperty("dateStart"))
      q += ` year:${user.dateStart}-${user.dateEnd}`;
    return new URLSearchParams({ type: "track", limit: 50, q: q }).toString();
  }

  async makeSpotifyRequest(path) {
    console.log("Requesting " + path);

    const options = {
      hostname: "api.spotify.com",
      port: 443,
      path: path,
      method: "GET",
      headers: {
        Authorization: `Bearer ${await this.accessTokenManager.get()}`,
      },
    };

    function makeRequest(resolve, reject) {
      function handleResponse(response) {
        if (response.statusCode === 429) reject(new HTTPS429Error());
        else {
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

  /* pickSongs recieves an array items of objects representing songs, and 
  and chooses this.pickPerSearch of them, guaranteed to not choose more than one song by a
  single artist. */
  pickSongs(items) {
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
    for (let i = 0; i < Math.min(this.pickPerSearch, artistNames.length); i++) {
      // Chose a random artist
      let randomArtist = randomChoice(artistNames);
      // Push a random one of their songs to chosenSongs
      chosenSongs.push(randomChoice(artistsMap.get(randomArtist)));
      // Remove them from artistNames
      artistNames = artistNames.filter((artist) => artist !== randomArtist);
    }
    return chosenSongs;
  }

  /* pickSongsByPopularity calls pickNSongs after first filtering based on
     the user's popularity filter settings. */
  pickSongsByPopularity(user, items) {
    return this.pickSongs(items.filter(item => item.popularity >= user.popularityStart && item.popularity <= user.popularityEnd));
  }

  async searchForSongs(users) {
    return new Map(
      await Promise.all(
        users.map(async (user) => {
          const searchResults = await this.makeSpotifyRequest(
            "/v1/search?" + this.buildSearchQueryString(user),
          );
          return [
            user.id,
            user.hasOwnProperty("popularityStart") || user.hasOwnProperty("popularityEnd") ?
            this.pickSongsByPopularity(user, searchResults.tracks.items) :
            this.pickSongs(searchResults.tracks.items)
          ];
        }),
      ),
    );
  }

  removeNoSearchResultsUsers(userSongs) {
    for (let user of userSongs.keys()) {
      if (userSongs.get(user).length === 0) userSongs.delete(user);
    }
    return userSongs;
  }

  searchesReturnedNothing(userSongs) {
    return [...userSongs.values()].flat().length === 0;
  }

  /* lookupGenres takes the object userSongs, extracts all the artists' IDs from
     all the songs, requests Spotify's /v1/artists endpoint to get the 'genre'
     attribute for each artist, and then adds a 'genres' property to each song
     object in userSongs, and returns the modified userSongs. */
  async lookupGenres(userSongs) {
    let ids = [...userSongs.values()]
      .flat()
      .map((song) => song.artists)
      .flat()
      .map((artist) => artist.id);
    ids = [...new Set(ids)];

    const artistsData = (
      await this.makeSpotifyRequest("/v1/artists?ids=" + ids.join(","))
    ).artists;

    /* For each song in all of userSongs, create an empty array for the genres
       property, and for each artist in that song, append the genres of that
       artist from artistsData to that song's genres array. */
    for (let songs of [...userSongs.values()])
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

  formatSong(song) {
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

  formatUserSongs(userSongs) {
    return new Map(
      [...userSongs.keys()].map((user) => [
        user,
        userSongs.get(user).map(this.formatSong),
      ]),
    );
  }

  async pushSongsToRedis(userId, songs) {
    for (let song of songs)
      await this.redisClient.SADD(userId, JSON.stringify(song));
    console.log(`Pushed ${songs.length} songs to ${userId}.`);
  }

  // TODO: comment this
  async pushUserSongsToRedis(users, userSongs) {
    for (let userId of userSongs.keys()) {
      const justUsedFilterParams = users.find((user) => user.id === userId);
      const currentFilterParams = JSON.parse(
        await this.redisClient.HGET("users", userId),
      );
      // TODO: use proper locking!
      if (
        userId === "songs" ||
        !haveFilterParamsChanged(justUsedFilterParams, currentFilterParams)
      )
        await this.pushSongsToRedis(userId, userSongs.get(userId));
    }
  }

  /* Instead of implementing a simple moving average, we're just going
     to decrement user.searchTermLength by 1 if we found no songs, and
     increment by 1 if we found > this.pickPerSearch / 2 this loop. */
  async adjustSearchTermLengths(users, userSongs) {
    for (let user of users.filter((user) => user.id !== "songs")) {
      const songsFoundThisLoop =
        userSongs.get(user.id) === undefined
          ? 0
          : userSongs.get(user.id).length;
      if (songsFoundThisLoop === 0) {
        user.searchTermLength = Math.max(1, user.searchTermLength - 1);
        await this.redisClient.HSET("users", user.id, JSON.stringify(user));
      } else if (songsFoundThisLoop > this.pickPerSearch / 2) {
        user.searchTermLength += 1;
        await this.redisClient.HSET("users", user.id, JSON.stringify(user));
      }
    }
  }

  async start() {
    while (true) {
      try {
        const users = await this.getUsers();

        if (users.length > 0) {
          /* A Map mapping user.ids to arrays of song objects. */
          let userSongs = await this.searchForSongs(users);
          userSongs = this.removeNoSearchResultsUsers(userSongs);

          if (this.searchesReturnedNothing(userSongs))
            console.log("No songs found!");
          else {
            userSongs = await this.lookupGenres(userSongs);
            userSongs = this.formatUserSongs(userSongs);
            await this.pushUserSongsToRedis(users, userSongs);
          }

          await this.adjustSearchTermLengths(users, userSongs);
        }
      } catch (error) {
        if (error instanceof HTTPS429Error) {
          console.log("Got a 429");
          await this.sleep(this._429TimeoutSeconds);
        } //else throw error;
      }

      await this.sleep(this.everyLoopTimeoutSeconds);
    }
  }
};
