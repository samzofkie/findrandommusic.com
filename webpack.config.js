const path = require("path");

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
  devtool: "source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 9000,
    proxy: {
      '/songs': 'http://localhost:3000',
    },
  },
};
