const https = require('node:https');
const fs = require('node:fs');
const redis = require('redis');


const names = fs.readFileSync('./dictionaries/names', 'utf8').split('\n');
const words = fs.readFileSync('./dictionaries/wordlist.10000', 'utf8').split('\n');
let gibberishIndex = 0;

function readCachedAccessToken() {
  if (!accessTokenCached()) {
    console.error('Tried to read cached access token when none exists!');
    return [undefined, undefined];
  } else {
    const [token, expirationDateString] = fs.readFileSync('access-token', 'utf8').split('\n');
    return [token, new Date(expirationDateString)];
  }
}

function accessTokenCached() {
  return fs.existsSync('access-token');
}

function readClientIdAndSecret() {
  const client_id = process.env.CLIENT_ID;
  const client_secret = process.env.CLIENT_SECRET;

  if (!client_id || !client_secret) {
    console.error('Missing CLIENT_ID or CLIENT_SECRET environment variables. Exiting...');
    process.exit(1);
  }

  return [client_id, client_secret];
}

function readAccessTokenFromHttpsResponse(data) {
  const dataString = data.toString();
  const tokenRe = RegExp('"access_token":"[a-zA-Z0-9\-_]*', 'g');
  const accessToken = dataString.match(tokenRe)[0].slice(16);

  const expiresInRe = RegExp('"expires_in":[0-9]*', 'g');
  const expiresInSeconds = parseInt(dataString.match(expiresInRe)[0].slice(13));
  const currentTime = new Date();
  const expirationDate = new Date(currentTime.getTime() + expiresInSeconds * 1000);

  return [accessToken, expirationDate];
}

function requestNewAccessToken() {
  const [client_id, client_secret] = readClientIdAndSecret();
  const requestBody = `grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`;

  const options = {
    hostname: 'accounts.spotify.com',
    port: 443,
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', (data) => {
        resolve(readAccessTokenFromHttpsResponse(data));
      });
    });
    req.on('error', (err) => reject(err));
    req.write(requestBody);
    req.end();
  });
}

async function cacheAccessToken(token, expirationDate) {
  console.log('Caching the new access token...');
  fs.writeFile('access-token',`${token}\n${expirationDate}`,(err) => {
    if (err) 
      console.error('Writing \'access-token\' failed.');
  });
}

async function requestAndCacheNewAccessToken() {
  console.log('Requesting a new access token...');
  
  const [token, expirationDate] = await requestNewAccessToken();
  
  cacheAccessToken(token, expirationDate);
  
  return token;
}

function getAccessToken() {
  if (accessTokenCached()) {
    const [token, expirationDate] = readCachedAccessToken();
    if (new Date() < expirationDate) {
      return token
    } else {
      return requestAndCacheNewAccessToken();
    }
  } else {
    return requestAndCacheNewAccessToken();
  }
}

function gibberishTruncate(word) {
  if (word.length < 5)
    return word;
  const desiredLength = 5 + Math.floor(Math.random() * (word.length - 5));
  const startIndex = Math.floor(Math.random() * (word.length - desiredLength));
  return word.slice(startIndex, startIndex + desiredLength);
}

function gibberish() {
  function gib1() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const len = 3 + Math.floor(Math.random() * 4);
    let gib = '';
    for (let i=0; i<len; i++)
      gib += chars.charAt(Math.floor(Math.random() * chars.length));
    return gib; 
  }

  function gib2() {
    const index = Math.floor(Math.random() * names.length);
    return gibberishTruncate(names[index]);
  }

  function gib3() {
    const index = Math.floor(Math.random() * words.length);
    return gibberishTruncate(words[index]);
  }

  const gibFunctions = [gib1, gib2, gib3];
  gibberishIndex++;
  if (gibberishIndex > gibFunctions.length - 1)
    gibberishIndex = 0;

  return gibFunctions[gibberishIndex]();
}

function makeSearchRequest(token, searchTerm) {
  //console.log(`Searching for ${searchTerm}...`);
  const options = {
    hostname: 'api.spotify.com',
    port: 443,
    path: `/v1/search?q=${searchTerm}&type=track&limit=50`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

function randomIndexes(length, num) {
  let indexes = [];
  while (num >= 0) {
    let candidate = Math.floor(Math.random() * length);
    if (!(candidate in indexes)) {
      indexes.push(candidate);
      num--;
    }
  }
  return indexes;
}

function extractAndFormatSongJsons(searchResultsJson) {
  let tracks = searchResultsJson.tracks.items;
  const numberToPick = 5;

  if (tracks.length > 5) {
    const indexes = randomIndexes(tracks.length, numberToPick);
    let temp = [];
    for (let index of indexes)
      temp.push(tracks[index]);
    tracks = temp;
  }
  return tracks.map((track) => {
    return {
      'id': track.id,
      'track': {
        'name': track.name,
        'url': track.external_urls.spotify,
      },
      'artwork_url': track.album.images['1'].url,
      'playback_url': track.preview_url,
      'artists': track.artists.map((artist) =>
        ({
          'name': artist.name,
          'url': artist.external_urls.spotify,
        })
      ),
      'release_date': track.album.release_date,
      'popularity': track.popularity,
      'album': {
        'name': track.album.name,
        'url': track.album.external_urls.spotify,
      },
    };
  });
}

function pushSongJsonsToRedisCache(songJsons, client) {
  songJsons.map((songJson) => {
    client.sAdd('songs', JSON.stringify(songJson));
  });
}

async function findAndCacheSongs(redisClient) {
  try {
    const accessToken = await getAccessToken();
    const searchTerm = gibberish();
    const searchResultsJson = await makeSearchRequest(accessToken, searchTerm);
  
    const songJsons = extractAndFormatSongJsons(searchResultsJson);
    pushSongJsonsToRedisCache(songJsons, redisClient);
  } catch (error) {
    console.log(error);
  }
}

async function replenishSongCache(client) {
  let numSongs = await client.sCard('songs');
  while (numSongs < 500) {
    console.log(`Cache contains ${numSongs} songs. Searching...`);
    await findAndCacheSongs(client);
    numSongs = await client.sCard('songs');
  }
}

function startCrawlerDaemon() {
  const client = redis.createClient({
    'url': 'redis://redis',
  });
  client.on('error', err => console.log('Redis Client Error', err));
  client.connect();
  
  replenishSongCache(client);
  setInterval(() => replenishSongCache(client), 30 * 1000);
}

startCrawlerDaemon();
