var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var Chypt = require('./apps/Chypt/chypt')(io);
var BallGame = require('./apps/BallGame/ballgame')(io);
//var GameLearning = require('./apps/GameLearning/gamelearning')();
var WallLearning = require('./apps/WallLearning/walllearning')();

app.use(express.static('htdocs'));

var port = 3000;
if(process.argv[2] != undefined) {
  port = process.argv[2];
}

http.listen(port, function(){
  console.log('listening on *:' + port);
});

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);

  var d = new Date();
  var hours = d.getHours();
  if(hours < 10) hours = "0" + hours;
  var minutes = d.getMinutes();
  if(minutes < 10) minutes = "0" + minutes;
  var time = hours + ":" + minutes;

  fs.appendFile(__dirname + '/log.txt', time + " - " + err + "\n", function(e){
    if(e) console.log(e);
  })
});
