var express = require('express');
var path = require('path');
var morgan = require('morgan');
const {createClient} = require('redis');
const {rateLimit} = require('express-rate-limit');

const genrePlaylists = require('./shared/genres.json');


const SERVE_STATIC = process.argv[2] === '--serve-static=true';

const client = createClient({
  'url': 'redis://redis',
});
client.on('error', err => console.log('Redis Client Error', err));
client.connect();

const app = express();

app.use(morgan(function (tokens, req, res) {
  return [
    tokens.date(req, res),
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

app.use('/songs', rateLimit({
  windowMs: 1000,
  max: 2,
}));

app.get('/songs', async (req, res) => {
  // TODO:
  // validate input
  const userId = req.query.id;
  if (!userId) {
    res.status(404).send('Sorry your id param j ain\'t lookin right...');
    return;
  }
  
  let settings = req.query;
  delete settings.id;
  settings.genres = settings.genres.split(',');
  settings.mostRecentRequest = new Date().toString();
  await client.HSET('users', userId, JSON.stringify(settings)); 
  
  let songs = [];
  for (let i=0; i<10; i++) {
    const song = await client.sPop('songs');
    songs.push(song);
  }
  res.send(songs);
});

app.get('/genre-list', async (req, res) => {
  res.send(Object.keys(genrePlaylists));
});

if (SERVE_STATIC)
  app.use(express.static('public'))

const port = 3000;

app.listen(port, () => {
  console.log(`app.js listening on port ${port}`)
  if (SERVE_STATIC)
    console.log('serving static files from \'public\' dir');
})

