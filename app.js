var express = require('express');
var path = require('path');
var logger = require('morgan');
const {createClient} = require('redis');

const client = createClient({
  'url': 'redis://redis',
});
client.on('error', err => console.log('Redis Client Error', err));
client.connect();

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/songs', async (req, res) => {
  let songs = [];
  for (let i=0; i<20; i++) {
    const song = await client.sPop('songs');
    songs.push(song);
  }
  res.send(songs);
});

module.exports = app;
