var express = require('express');
var path = require('path');
var logger = require('morgan');
//var indexRouter = require('./routes/index');
let {findSongs, artUrls} = require('./crawler');

var app = express();

findSongs();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/art', (req, res) => {
  res.send(artUrls);
  findSongs();
});

module.exports = app;
