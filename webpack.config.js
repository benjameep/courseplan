const path = require('path')
module.exports = {
  mode:'development',
  entry:'./src/main.js',
  output:{
    filename:'bundle.js',
    path:__dirname
  },
  module:{
    rules: [
      // { 
      //   test: /\.js$/, 
      //   exclude: /node_modules/, 
      //   use:{
      //     loader:'babel-loader', 
      //     options:{
      //       presets: ['babel-preset-env'],
      //     }
      //   } 
      // },
      {test:/\.ejs$/, loader:'ejs-compiled-loader?htmlmin' },
      {test:/\.css$/,use: [ 'style-loader', 'css-loader' ]},
      {test:/\.svg$/,loader:'url-loader',query:{mimetype:'image/svg+xml'}},
      {test:/\.woff$/,loader:'url-loader',query:{mimetype:'application/font-woff'}},
      {test:/\.woff2$/,loader:'url-loader',query:{mimetype:'application/font-woff2'}},
      {test:/\.[ot]tf$/,loader:'url-loader',query:{mimetype:'application/octet-stream'}},   
      {test:/\.eot$/,loader:'url-loader',query:{mimetype:'application/vnd.ms-fontobject'}}
    ]
  }
}