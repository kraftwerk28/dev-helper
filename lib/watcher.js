'use strict';

const fs = require('fs');
const watchers = [];

module.exports = (path, callback) => {
  if (watchers.findIndex((el) => el.fname === path) < 0) {
    const watcher =
      fs.watch(path, (event, filename) => {
        callback(event, filename);
      });
    watchers.push({
      fname: path,
      watcher
    });
  }
};
