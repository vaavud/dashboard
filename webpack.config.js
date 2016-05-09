var WebpackNotifierPlugin = require('webpack-notifier')

module.exports = {
  context: __dirname + '/src',
  entry: './main',
  output: {
    path: process.env.NODE_ENV === 'production' ? './build' : './dev',
    filename: './[name].js'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
    ],
  },
  plugins: [
    new WebpackNotifierPlugin(),
  ]
}
