var fs = require('fs');

exports = module.exports = function(io) {

  var canvasSize = 800;

  function Player(id) {
    var self = {
      x: Math.random()*canvasSize,
      y: Math.random()*canvasSize,
      id: id,
      velX: 0,
      velY: 0,
      angle: 0,
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
    self.shoot = function() {
      Bullet({
        x: self.x,
        y: self.y,
        angle: self.angle,
        shooterId: self.id
      });
    }
    Player.list[self.id] = self;
    return self;
  }
  Player.list = {};

  function Bullet(data) {
    var self = {
      x: data.x,
      y: data.y,
      id: Math.random(),
      velX: Math.cos(data.angle/180*Math.PI) * 15,
      velY: Math.sin(data.angle/180*Math.PI) * 15,
      shooterId: data.shooterId
    }
    self.updatePosition = function() {

      /*if(self.x > canvasSize) {
        self.x = canvasSize;
        self.velX *= -1;
      } else if (self.x < 0) {
        self.x = 0;
        self.velX *= -1;
      } else if(self.y > canvasSize) {
        self.y = canvasSize;
        self.velY *= -1;
      } else if (self.y < 0) {
        self.y = 0;
        self.velY *= -1;
      }*/

      if((self.x > canvasSize) || (self.x < 0) || (self.y > canvasSize) || (self.y < 0)) {
        delete Bullet.list[self.id];
      }

      self.x += self.velX;
      self.y += self.velY;
    }
    Bullet.list[self.id] = self;
    return self;
  }
  Bullet.list = {};

  var ballNSP = io.of('/BallGame');
  ballNSP.on('connection', function(socket){

    var player = Player(socket.id);

    ballNSP.to(socket.id).emit('set_player_id', socket.id);

    socket.on('player_key_press', function(data){
      player.keyPresses[data.key] = data.pressed;
    })

    socket.on('player_mouse_move', function(data){
      var deltaX = data.x - player.x;
      var deltaY = data.y - player.y;
      player.angle = Math.atan2(deltaY,deltaX) * 180 / Math.PI;
    })

    socket.on('player_shoot', function(data){
      player.shoot();
    })

    socket.on('console_log', function(msg){
      console.log(msg);
    })

    socket.on('eval_this', function(data){
      result = eval(data);
      ballNSP.to(socket.id).emit('console_log', result);
    })

    socket.on('disconnect', function(){
      delete Player.list[socket.id];
      for(var i in Bullet.list) {
        var bullet = Bullet.list[i];
        if(bullet.shooterId == socket.id) {
          delete Bullet.list[i];
        }
      }
    })

  });

  setInterval(function(){
    var data = {
      players: {},
      bullets: {}
    };

    for(var i in Player.list) {
      var player = Player.list[i];

      player.updateVelocity();
      player.updatePosition();

      data.players[player.id] = {
        x: player.x,
        y: player.y,
        angle: player.angle
      }
    }

    for(var i in Bullet.list){
      var bullet = Bullet.list[i];

      bullet.updatePosition();

      data.bullets[bullet.id] = {
        x: bullet.x,
        y: bullet.y
      }
    }

    ballNSP.emit('render_all', data);
  },1000/64);

}
