const https = require('node:https');
const fs = require('node:fs');
const redis = require('redis');

const { gibberish } = require('./gibberish.js');
const { getAccessToken } = require('./accessToken.js');
const genrePlaylists = require('./shared/genres.json');


function initializeRedisClient() {
  const client = redis.createClient({
    'url': 'redis://redis',
  });
  client.on('error', err => console.log('Redis Client Error', err));
  client.connect();
  return client;
}

class HTTPS429Error extends Error {}

function requestSpotify(accessToken, path) { 
  //console.log('Requesting ' + path);
  
  const options = {
    hostname: 'api.spotify.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
  };

  function makeRequest(resolve, reject) {

    function handleResponse(response) {
      if (response.statusCode === 429) {
        reject(new HTTPS429Error());
      } else {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(JSON.parse(data)));
      }
    }

    const req = https.request(options, handleResponse);
    req.on('error', err => reject(err));
    req.end();
  }

  return new Promise(makeRequest);
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
    song.genres = [... new Set(song.artists.reduce((acc, artist) => [...acc, ...genreMap.get(artist.name)], []))]
      .map(genre => ({ 
        'name': genre, 
        'url': 'https://open.spotify.com/playlist/' + genrePlaylists[genre]
      })); 
  return songs;
}

function formatSongData(songs) {
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

async function trawlForSongs(redisClient, numSongs) {
  while (await redisClient.sCard('songs') < numSongs) {
    const accessToken = await getAccessToken();
    const searchTerm = gibberish();

    const searchResultsJson = await requestSpotify(accessToken, `/v1/search?q=${searchTerm}&type=track&limit=50`);
    
    if (searchResultsJson.tracks.total === 0) {
      console.log(`Searching for ${searchTerm} returned 0 songs.`);
      continue;
    }
    const selectedSongs = pickNSongs(searchResultsJson.tracks.items, 5);
    const songsWithGenreInfo = await lookupGenres(accessToken, selectedSongs);
    const formattedSongs = formatSongData(songsWithGenreInfo);
    pushSongsToRedisCache(redisClient, formattedSongs);
  }
}

async function start() {
  const redisClient = initializeRedisClient();
  const checkCacheIntervalSeconds = 1;
  const numSongs = 500;

  const sleep = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));
  
  console.log('Crawler starting.');
 
  while (true) {
    try {
      const userIds = await redisClient.HKEYS('users');
      let userSettings = new Map();
      for (let id of userIds) {
        let settings = JSON.parse(await redisClient.HGET('users', id));
        settings.recentRequest = new Date(settings.recentRequest);
        let minutesOld = (new Date() - settings.recentRequest) / (1000 * 60);
        if (minutesOld > 10) {
          await redisClient.HDEL('users', id);
        } else {
          userSettings.set(id, settings)
        }
      }
 
      await trawlForSongs(redisClient, numSongs);
    } catch (error) {
      if (error instanceof HTTPS429Error) {
        console.log('Got a 429');
        await sleep(2.5);
      } else
        console.error(error);//throw error;
    }
    await sleep(checkCacheIntervalSeconds);
  }
}

start();
