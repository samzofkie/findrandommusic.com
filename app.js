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

app.get('/art', async (req, res) => {
  const len = await client.lLen('songs');
  let urls = [];
  for (let i=0; i<len; i++) {
    const url = await client.lPop('songs');
    urls.push(url);
  }
  res.send(urls);
});

module.exports = app;
