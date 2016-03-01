var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: ['./src/app.js'],
  output: {
      publicPath: '/',
      filename: './static/app.js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        include: path.join(__dirname, 'src'),
        loader: 'babel-loader',
        query: {presets: ["es2015", "react"]}
      }
    ]
  },
  debug: true
};