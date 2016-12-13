var fs = require('fs');

exports = module.exports = function(io) {

  var players = {}
  var joinedPlayers = 0;

  var ballNSP = io.of('/BallGame');

  ballNSP.on('connection', function(socket){

    joinedPlayers++;
    var id = joinedPlayers;

    players[id] = {
      keys: {}
    };

    ballNSP.to(socket.id).emit('set_player_id',id);

    socket.on('get_player_position', function(player,random){
      if(random) {
        var x =  parseInt(Math.random() * 1000)/1000;
        var y =  parseInt(Math.random() * 1000)/1000;
        players[id].x = x;
        players[id].y = y;
      } else {
        var x = players[player].x;
        var y = players[player].y;
      }
      ballNSP.to(socket.id).emit('set_player_position',player,x,y);
    })

    socket.on('update_player_position', function(x,y) {
      players[id].x = x/1000;
      players[id].y = y/1000;
    })

    socket.on('request_player_positions', function() {
      for(var key in players) {
        if(key != except) {
          if(players.hasOwnProperty(key)) {
            ballNSP.to(socket.id).emit('set_player_position',key,players[key].x,players[key].y);
          }
        }
      }
    })

    socket.on('player_key_press', function(data){
      players[id].keys[data.key] = data.pressed;
    })

    socket.on('console_log', function(msg){
      console.log(msg);
    })

    socket.on('disconnect', function(){
      delete players[id];
      ballNSP.emit('player_disconnect',id);
    })

  });
}
