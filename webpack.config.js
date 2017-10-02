const Html = require("html-webpack-plugin");

module.exports = {
  entry: "./src/example.js",
  output: {
    path: __dirname,
    filename: "./dist/example.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  plugins: [new Html()]
};
