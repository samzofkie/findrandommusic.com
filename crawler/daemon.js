const https = require('node:https');
const fs = require('node:fs');
const redis = require('redis');

const { gibberish } = require('./gibberish.js');
const { getAccessToken } = require('./accessToken.js');
const genrePlaylists = require('./genres.json');

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

function pickNSongs(items, n) {
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

async function lookupGenres(accessToken, songs) {
  let ids = songs.map(song => song.artists.map(artist => artist.id)).flat();
  const artistsData = await requestSpotify(accessToken, `/v1/artists?ids=${ids.join(',')}`);
  const genreMap = new Map(artistsData.artists.map(artist => [artist.name, artist.genres]));
  for (let song of songs)
    song.genres = song.artists.reduce((acc, artist) => [...acc, ...genreMap.get(artist.name)], [])
      .map(genre => ({ 
        'name': genre, 
        'url': 'https://open.spotify.com/playlist/' + genrePlaylists[genre]
      })); 
  return songs;
}

function reformatSongData(songs) {
  return songs.map(song => ({
      'id': song.id,
      'artwork_url': song.album.images['0'].url,
      'playback_url': song.preview_url,
      'release_date': song.album.release_date,
      'popularity': song.popularity,
      'track': {
        'name': song.name,
        'url': song.external_urls.spotify
      },
      'artists': song.artists.map(artist => ({
        'name': artist.name,
        'url': artist.external_urls.spotify,
        'id': artist.id
      })),
      'album': {
        'name': song.album.name,
        'url': song.album.external_urls.spotify
      },
      'genres': song.genres.map((genre, i) => ({
        'name': genre.name,
        'url': genre.url,
        'id': i
      }))
    }));
}

function pushSongsToRedisCache(redisClient, items) {
  items.map(item => redisClient.sAdd('songs', JSON.stringify(item)));
}

function start() {
  const redisClient = initializeRedisClient();
  const timeoutSeconds = 1;
  setInterval(async () => {
    try {
      while (await redisClient.sCard('songs') < 500) { 
        const accessToken = await getAccessToken();
        const searchTerm = gibberish();
         
        await requestSpotify(accessToken, `/v1/search?q=${searchTerm}&type=track&limit=50`)
          .then(resJson => pickNSongs(resJson.tracks.items, 5))
          .then(songs => lookupGenres(accessToken, songs))
          .then(reformatSongData)
          .then(songs => pushSongsToRedisCache(redisClient, songs));
      }
    } catch (error) { 
      console.log(error);
    }
  }, timeoutSeconds * 1000);
}

start();
