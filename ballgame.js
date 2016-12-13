var fs = require('fs');

exports = module.exports = function(io) {

  var SOCKET_LIST = {};
  var PLAYER_LIST = {};
  var BULLET_LIST = {};

  var canvasSize = 800;

  function Player(id) {
    var self = {
      x: Math.random()*canvasSize,
      y: Math.random()*canvasSize,
      id: id,
      velX: 0,
      velY: 0,
      maxSpeed: 5,
      acceleration: 1,
      friction: 0.95,
      keyPresses: {}
    }
    self.updateVelocity = function() {
      if(self.keyPresses[83]) { //S
        self.velY += self.acceleration;
        if(self.velY > self.maxSpeed) self.velY = self.maxSpeed;
      }
      if(self.keyPresses[68]) { //D
        self.velX += self.acceleration;
        if(self.velX > self.maxSpeed) self.velX = self.maxSpeed;
      }
      if(self.keyPresses[87]) { //W
        self.velY -= self.acceleration;
        if(self.velY < -self.maxSpeed) self.velY = -self.maxSpeed;
      }
      if(self.keyPresses[65]) { //A
        self.velX -= self.acceleration;
        if(self.velX < -self.maxSpeed) self.velX = -self.maxSpeed;
      }
      self.velX *= self.friction;
      self.velY *= self.friction;
    }
    self.updatePosition = function() {
      self.x += self.velX;
      self.y += self.velY;
      if(self.x > canvasSize) self.x = canvasSize;
      if(self.x < 0) self.x = 0;
      if(self.y > canvasSize) self.y = canvasSize;
      if(self.y < 0) self.y = 0;
    }
    self.shoot = function(angle) {
      var bullet = Bullet(self.x,self.y,angle,self.id);
      BULLET_LIST[bullet.id] = bullet;
    }
    return self;
  }

  function Bullet(x,y,angle,shooterId) {
    var self = {
      x: x,
      y: y,
      id: Math.random(),
      angle: angle,
      speedMultiplier: 15,
      shooterId: shooterId
    }
    self.updatePosition = function() {
      velX = Math.cos(self.angle/180*Math.PI) * self.speedMultiplier;
      velY = Math.sin(self.angle/180*Math.PI) * self.speedMultiplier;

      self.x += velX;
      self.y += velY;

      if((self.x > canvasSize) || (self.x < 0) || (self.y > canvasSize) || (self.y < 0)) {
        delete BULLET_LIST[self.id];
      }
    }
    BULLET_LIST[self.id] = self;
    return self;
  }

  var ballNSP = io.of('/BallGame');
  ballNSP.on('connection', function(socket){

    id = Math.random();
    SOCKET_LIST[id] = socket;

    var player = Player(id);
    PLAYER_LIST[id] = player;

    ballNSP.to(socket.id).emit('set_player_id', id);

    socket.on('player_key_press', function(data){
      player.keyPresses[data.key] = data.pressed;
    })

    socket.on('player_shoot', function(data){
      var deltaX = data.x - player.x;
      var deltaY = data.y - player.y;
      var angle = Math.atan2(deltaY,deltaX) * 180 / Math.PI;

      player.shoot(angle);
    })

    socket.on('console_log', function(msg){
      console.log(msg);
    })

    socket.on('disconnect', function(){
      delete SOCKET_LIST[id];
      delete PLAYER_LIST[id];
      for(var i in BULLET_LIST) {
        var bullet = BULLET_LIST[i];
        if(bullet.shooterId == id) {
          delete BULLET_LIST[i];
        }
      }
    })

  });

  setInterval(function(){
    var data = {
      players: {},
      bullets: {}
    };
    for(var i in PLAYER_LIST) {
      var player = PLAYER_LIST[i];

      player.updateVelocity();
      player.updatePosition();

      data.players[player.id] = {
        x: player.x,
        y: player.y
      }
    }

    for(var i in BULLET_LIST){
      var bullet = BULLET_LIST[i];

      bullet.updatePosition();

      data.bullets[bullet.id] = {
        x: bullet.x,
        y: bullet.y
      }
    }

    for(var socket in SOCKET_LIST) {
      SOCKET_LIST[socket].emit('render_all', data);
    }
  },canvasSize/64);

}
