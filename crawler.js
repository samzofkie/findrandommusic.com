const https = require('node:https');
const fs = require('node:fs');


function extractArt(res) {
  const numTracks = res.tracks.total;
  let artUrls = [];
  for (let index in res.tracks.items) {
    const track = res.tracks.items[index];
    const artUrl = track.album.images['0'].url;
    artUrls.push(artUrl);
  }
  // TODO
}

function gibberish() { 
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const len = 3 + Math.floor(Math.random() * 4);
  let gib = '';
  for (let i=0; i<len; i++)
    gib += chars.charAt(Math.floor(Math.random() * chars.length));
  return gib; 
}

function makeSearchRequest(accessToken) {
  const searchTerm = gibberish();
  const options = {
    hostname: 'api.spotify.com',
    port: 443,
    path: `/v1/search?q=${searchTerm}&type=track&limit=50`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      /*fs.writeFile(
        'search-results.json',
        data,
        (err) => { 
          if (err) {
            console.error('Writing \'search-results.json\' failed.');
            process.exit(1);
          }
        }
      );*/
      extractArt(JSON.parse(data)); 
    });  
  });
  req.on('error', (e) => {
    console.error(e);
  });
  req.end(); 
}

function writeAccessToken(accessToken, tokenExpirationDate) { 
  fs.writeFile(
    'access-token',
    `${accessToken}\n${tokenExpirationDate}`,
    (err) => {
      if (err) {
        console.error('Writing \'access-token\' failed.');
        process.exit(1);
      }
      makeSearchRequest(accessToken);
    }
  );
}

function generateAccessToken() {
  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    console.error("Missing CLIENT_ID or CLIENT_SECRET environment variables.");
    process.exit(1);
  }

  const client_id = process.env.CLIENT_ID;
  const client_secret = process.env.CLIENT_SECRET;

  const options = {
    hostname: 'accounts.spotify.com',
    port: 443,
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const req = https.request(options, (res) => {
    res.on('data', (d) => {
      const accessToken = d.toString().match(/"access_token":"[a-zA-Z0-9\-_]*/g)[0].slice(16);
      const expiresInSeconds = parseInt(d.toString().match(/"expires_in":[0-9]*/g)[0].slice(13));
      const currentTime = new Date();
      const tokenExpirationDate = new Date(currentTime.getTime() + expiresInSeconds * 1000);
      writeAccessToken(accessToken, tokenExpirationDate);
    });
  });
  req.on('error', (e) => {
    console.error(e);
  });
  req.write(`grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`);
  req.end();
}

function readAccessToken() {
  fs.readFile('access-token', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      console.error('failed to read file \'access-token\'');
      process.exit(1);
    }
    const [accessToken, expirationDateString] = data.split('\n');
    const expirationDate = new Date(expirationDateString);
    const currentDate = new Date();
    if (currentDate < expirationDate)
      makeSearchRequest(accessToken);
    else
      generateAccessToken();
  });
}

function findSongs() {
  if (fs.existsSync('access-token'))
    readAccessToken();
  else
    generateAccessToken();
}

findSongs();
