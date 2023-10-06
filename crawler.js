const https = require('node:https');

const client_id = '';
const client_secret = '';

function gibberish() { 
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const len = 3 + Math.floor(Math.random() * 4);
  let gib = '';
  for (let i=0; i<len; i++)
    gib += chars.charAt(Math.floor(Math.random() * chars.length));
  return gib; 
}

function search(accessToken, searchTerm) {
  const options = {
    hostname: 'api.spotify.com',
    port: 443,
    path: `/v1/search?q=${searchTerm}&type=track`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
  };
  
  console.log(accessToken);
  console.log(searchTerm);

  const req = https.request(options, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);

    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  req.on('error', (e) => {
    console.error(e);
  });
  req.end(); 
}

function getAccessToken() {
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
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);

    res.on('data', (d) => {
      let accessToken = d.toString().match(/"access_token":"[a-zA-Z0-9\-_]*/g)[0].slice(16);
      search(accessToken, gibberish());
    });
  });
  req.on('error', (e) => {
    console.error(e);
  });
  req.write(`grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`);
  req.end();
}

function findSongs() {
  console.log(process.env.CLIENT_ID);
  console.log(process.env.CLIENT_SECRET);
}

findSongs()
