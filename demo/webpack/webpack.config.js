const path = require('path');

module.exports = {
  entry: './b.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};