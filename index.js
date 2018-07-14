#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const WebSocket = require('websocket').server;
const mutate = require('./lib/bodyMutator');
const register = require('./lib/watcher');

const args = process.argv.slice(2);
let port = 8080;
let client = null;
let rootFile = 'index.html';
let wsRootFile = '~' + rootFile;

const argRoute = {
  '^--html$|^-h$': (arg) => {
    rootFile = arg;
    wsRootFile = '~' + rootFile;
  },
  '^--port$|^-p$': (arg) => {
    port = arg;
  },
  '^--help$|^-h$': () => {
    console.log(fs.readFileSync('help', 'utf-8'));
    process.exit(0);
  },
  '^--no-verbose$-s': () => {
    console.log = () => { };
  },
};

args.forEach((argument, i) => {
  for (let temp in argRoute) {
    if (new RegExp(temp).test(argument)) {
      if ((i + 1 >= args.length && argRoute[temp].length > 0)) {
        console.log('Invalid cmd arguments. Exiting...');
        process.exit(0);
      }
      argRoute[temp](args[i + 1]);
      break;
    }
  }
});

fs.writeFileSync(wsRootFile, mutate(rootFile));

const oldLog = console.log;
console.log = (...args) => {
  oldLog('>', ...args);
};



const refresh = () => {
  client.send('r');
};

const server = http.createServer((req, res) => {
  const path = (req.url === '/') ? rootFile : '.' + req.url;
  if (!fs.existsSync(path)) {
    console.log('missing file: ' + path);
    return;
  };
  register(path, (ev, fname) => {
    if (fname === rootFile) {
      fs.writeFileSync(wsRootFile, mutate(rootFile));
    }
    console.log(fname + ' was changed...');
    refresh();
  });

  fs.readFile(path === rootFile ? wsRootFile : path,
    (err, data) => { res.end(data) });
});

const ws = new WebSocket({
  httpServer: server,
  autoAcceptConnections: false,
});

ws.on('request', (req) => {
  client = req.accept('', req.origin);
});

const exitCallback = () => {
  console.log('\nexiting...');
  fs.unlinkSync('~' + rootFile);
  process.exit(0);
};

process.on('SIGINT', exitCallback);
process.on('beforeExit', exitCallback);

server.on('error', (err) => {
  console.log('Error: ' + err.message);
  process.exit(0);
})

server.listen(port, () => {
  console.log('server listening on ' + port);
});
