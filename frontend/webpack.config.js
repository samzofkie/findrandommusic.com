const path = require('path');

module.exports = {
  //entry: './index.js',
  /*entry: {
    index: './index.js',
    song: './Song.js'
  },*/
  entry: {
    index: {
      import: './index.js',
      dependOn: 'shared'
    },
    song: {
      import: './Song.js',
      dependOn: 'shared'
    },
    shared: 'react'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  optimization: {
    runtimeChunk: 'single',
  },
  mode: 'production',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader"
    }]
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 9000,
    proxy: {
      '/songs': 'http://app:3000/'
    }
  }
};
