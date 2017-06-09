'use strict'
// webpack.config.js

let nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: './handler.js',
  target: 'node',
  output: {
    library: "lambda",
    libraryTarget: "commonjs2"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: __dirname,
      exclude: /node_modules/
    }]
  },
  externals: [nodeExternals()]
};
