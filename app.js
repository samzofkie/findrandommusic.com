var express = require('express');
var path = require('path');
var morgan = require('morgan');
const {createClient} = require('redis');

const dateFormatter = require('./date-formatter.js');

const client = createClient({
  'url': 'redis://redis',
});
client.on('error', err => console.log('Redis Client Error', err));
client.connect();

var app = express();

app.use(morgan(function (tokens, req, res) {
  return [
    dateFormatter.createDateString(new Date(tokens.date(req, res))),
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time'](req, res) + 'ms',
    tokens['remote-addr'](req, res),
    tokens['user-agent'](req, res),
  ].join(' ');
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/songs', async (req, res) => {
  let songs = [];
  for (let i=0; i<10; i++) {
    const song = await client.sPop('songs');
    songs.push(song);
  }
  res.send(songs);
});

module.exports = app;
