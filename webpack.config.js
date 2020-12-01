const path = require('path')

module.exports = {
  entry: {
    'playwave': './playwave.js',
    'wavesurfer': './wavesurfer.js',
    'wavesurfer.regions': './wavesurfer.regions.js',
    'wavesurfer.timeline': './wavesurfer.timeline.js',
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: '[name].min.js'
  },
  devtool: false,
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: { loader: 'babel-loader' } // options 在 .babelrc 定义
      }
    ]
  }
}