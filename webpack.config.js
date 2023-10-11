var path = require("path");

module.exports = {
  mode: 'development',
  entry: "./frontend/index.js",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      { 
        test: /\.js$/, 
        exclude: /node_modules/, 
        loader: "babel-loader",
      }
    ]
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 9000,
    proxy: {
      '/art': 'http://localhost:3000',
    },
  },
};
