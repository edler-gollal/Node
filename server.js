var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Chatter = require('./chatter')(io);
var BallGame = require('./ballgame')(io);

app.use(express.static('htdocs'));

http.listen(3003, function(){
  console.log('listening on *:3003');
});

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
