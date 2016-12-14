var fs = require('fs');

exports = module.exports = function(io) {

  //-----------------------//
  //------GLOBALS----------//
  //-----------------------//

  var DEBUG = false;
  var CONFIG = {
    canvasSize: 800,
    bgColor: "#E3F2FD",
    players: {
      radius: 5,
      color: "#BBDEFB"
    },
    bullets: {
      radius: 5,
      color: "black"
    },
  };
  CONFIG.players.radius = parseInt(CONFIG.canvasSize/30);
  CONFIG.bullets.radius = parseInt(CONFIG.canvasSize/200);

  //-----------------------//
  //------ENTITIES---------//
  //-----------------------//

  var Entity = function() {
    var self = {
      x: CONFIG.canvasSize/2,
      y: CONFIG.canvasSize/2,
      velX: 0,
      velY: 0,
    }

    self.update = function() {
      self.updatePosition();
    }

    self.updatePosition = function() {
      self.x += self.velX;
      self.y += self.velY;

      if((self.x > CONFIG.canvasSize) || (self.x < 0) || (self.y > CONFIG.canvasSize) || (self.y < 0)) {
        self.onBorderReach();
      }
    }

    self.onBorderReach = function() {
      if(self.x > CONFIG.canvasSize)
        self.x = CONFIG.canvasSize;
      if(self.x < 0)
        self.x = 0;
      if(self.y > CONFIG.canvasSize)
        self.y = CONFIG.canvasSize;
      if(self.y < 0)
        self.y = 0;
    }

    self.getDistanceTo = function(data) {
      return Math.sqrt(Math.pow(self.x-data.x,2) + Math.pow(self.y-data.y,2));
    }

    return self;
  }

  var Player = function(id) {
    var self = Entity();
    self.id = id;
    self.x = Math.random()*CONFIG.canvasSize;
    self.y = Math.random()*CONFIG.canvasSize;
    self.angle = 0;
    self.mousePos = {
      x: 0,
      y: 0
    }
    self.maxSpeed = 5;
    self.acceleration = 1;
    self.friction = 0.95;
    self.shootCooldown = 0;
    self.shootCooldownMax = 10;
    self.shotAmount = 1;
    self.shotSpread = 0;
    self.hp = 100;
    self.kills = 0;
    self.keyPresses = {};

    var super_update = self.update;
    self.update = function() {
      self.updateVelocity();
      super_update();

      self.updateAngle();
      self.updateShootCooldown();
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

    self.updateAngle = function() {
      var deltaX = self.mousePos.x - self.x;
      var deltaY = self.mousePos.y - self.y;
      self.angle = Math.atan2(deltaY,deltaX) * 180 / Math.PI;
    }

    self.updateShootCooldown = function() {
      if(self.shootCooldown > 0) {
        self.shootCooldown--;
      }
    }

    self.shoot = function() {
      if(self.shootCooldown == 0) {
        for(var i = 0; i<self.shotAmount; i++){
          var angle = self.angle + (Math.random() * self.shotSpread - self.shotSpread/2);
          Bullet({
            x: self.x,
            y: self.y,
            angle: angle,
            shooterId: self.id
          });
        }
        ballNSP.emit('play_sound', {
          sound: "shoot",
          volume: 0.1,
        });
        self.shootCooldown = self.shootCooldownMax;
      }
    }

    self.onHit = function(shooterId) {
      self.hp -= 20;
      if(self.hp <= 0) {
        self.hp = 100;
        self.x = Math.random()*CONFIG.canvasSize;
        self.y = Math.random()*CONFIG.canvasSize;
        ballNSP.emit('play_sound', {
          sound: "death",
          volume: 1,
        });
        Player.list[shooterId].kills++;
        if(Player.list[shooterId].kills%5 == 0) {
          ballNSP.emit('play_sound', {
            sound: "horn",
            volume: 1,
          });
        }
      }
    }

    Player.list[self.id] = self;
    return self;
  }
  Player.list = {};

  var Bullet = function(data) {
    var self = Entity();
    self.id = Math.random();
    self.x = data.x;
    self.y = data.y;
    self.velX = Math.cos(data.angle/180*Math.PI) * 15;
    self.velY = Math.sin(data.angle/180*Math.PI) * 15;
    self.shooterId = data.shooterId;

    var super_update = self.update;
    self.update = function() {
      super_update();
      self.checkCollision();
    }

    self.checkCollision = function() {
      for(var i in Player.list) {
        var player = Player.list[i];
        if(self.getDistanceTo({x: player.x, y: player.y}) < (CONFIG.players.radius-CONFIG.bullets.radius)) {
          if(self.shooterId != player.id) {
            delete Bullet.list[self.id];
            player.onHit(self.shooterId);
          }
        }
      }
    }

    self.onBorderReach = function() {
      delete Bullet.list[self.id];
    }

    Bullet.list[self.id] = self;
    return self;
  }
  Bullet.list = {};

  //-----------------------//
  //------EVENTS-----------//
  //-----------------------//

  var ballNSP = io.of('/BallGame');
  ballNSP.on('connection', function(socket){

    var player = Player(socket.id);

    socket.on('request_config', function(callback){
      callback(CONFIG);
    })

    socket.on('player_key_press', function(data){
      player.keyPresses[data.key] = data.pressed;
    })

    socket.on('player_mouse_move', function(data){
      player.mousePos = {
        x: data.x,
        y: data.y
      }
    })

    socket.on('player_shoot', function(data){
      player.shoot();
    })

    socket.on('console_log', function(msg){
      console.log(msg);
    })

    socket.on('eval_this', function(data){
      if(!DEBUG) return;
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

  //-----------------------//
  //------INTERVAL---------//
  //-----------------------//

  setInterval(function(){
    var data = {
      players: {},
      bullets: {}
    };

    for(var i in Player.list) {
      var player = Player.list[i];

      player.update();

      data.players[player.id] = {
        x: player.x,
        y: player.y,
        angle: player.angle,
        hp: player.hp,
        kills: player.kills
      }
    }

    for(var i in Bullet.list){
      var bullet = Bullet.list[i];

      bullet.update();

      data.bullets[bullet.id] = {
        x: bullet.x,
        y: bullet.y
      }
    }

    ballNSP.emit('render_all', data);
  },1000/64);

}
