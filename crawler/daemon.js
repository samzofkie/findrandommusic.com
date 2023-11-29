const https = require('node:https');
const fs = require('node:fs');
const redis = require('redis');

const { gibberish } = require('./gibberish.js');
const { getAccessToken } = require('./accessToken.js');


function initializeRedisClient() {
  const client = redis.createClient({
    'url': 'redis://redis',
  });
  client.on('error', err => console.log('Redis Client Error', err));
  client.connect();
  return client;
}

function requestSpotify(accessToken, path) {
  console.log('requesting ' + path);
  const options = {
    hostname: 'api.spotify.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode === 429)
        console.log('\ngot 429!\n')
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', (err) => reject(err));
    req.end();
  });

}

function pickNRandom(items, n) {
  let artists = Array.from(new Set(items.map(item => item.artists[0].name)));
  let artistsMap = new Map(
    artists.map(artist => [artist, items.filter(item => item.artists[0].name === artist)])
  );

  if (artistsMap.size > n) {
    let newArtistsMap = new Map();
    for (let i=0; i<n; i++) {
      let randomArtist = artists[Math.floor(Math.random() * artists.length)];
      newArtistsMap.set(randomArtist, artistsMap.get(randomArtist));
      artists = artists.filter(artist => artist !== randomArtist);
    }
    artistsMap = newArtistsMap;
  }

  return Array.from(artistsMap.keys())
    .map(artist => {
      let songs = artistsMap.get(artist);
      let index = Math.floor(Math.random() * songs.length);
      return songs[index];
    });
}

function reformatSongData(items) {
  return items.map((item) => ({
      'id': item.id,
      'artwork_url': item.album.images['0'].url,
      'playback_url': item.preview_url,
      'release_date': item.album.release_date,
      'popularity': item.popularity,
      'track': {
        'name': item.name,
        'url': item.external_urls.spotify
      },
      'artists': item.artists.map((artist) =>
        ({
          'name': artist.name,
          'url': artist.external_urls.spotify,
          'id': artist.id
        })
      ),
      'album': {
        'name': item.album.name,
        'url': item.album.external_urls.spotify
      }
    }));
}

async function lookupGenres(accessToken, items) {
  for (let item of items) {
    const ids = item.artists.map(artist => artist.id)
      .reduce((prev, curr) => prev + ',' + curr, '')
      .slice(1);
    const artistsData = await requestSpotify(accessToken, `/v1/artists?ids=${ids}`);
    const allGenres = artistsData.artists.map(artist => artist.genres).flat();
    item.genres = allGenres;
  }
  return items;
}

function pushSongsToRedisCache(redisClient, items) {
  items.map(item => redisClient.sAdd('songs', JSON.stringify(item)));
}

function start() {
  const redisClient = initializeRedisClient();
  const timeoutSeconds = 30;
  setInterval(async () => {
    try {
      while (await redisClient.sCard('songs') < 500) { 
        const accessToken = await getAccessToken();
        const searchTerm = gibberish();
         
        await requestSpotify(accessToken, `/v1/search?q=${searchTerm}&type=track&limit=50`)
          .then(resJson => pickNRandom(resJson.tracks.items, 5))
          .then(reformatSongData)
          .then(items => lookupGenres(accessToken, items))
          .then(items => pushSongsToRedisCache(redisClient, items));
      }
    } catch (error) { 
      console.log(error);
    }
  }, timeoutSeconds * 1000);
}

start();
