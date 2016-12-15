var fs = require('fs');

exports = module.exports = function(io) {

  //-----------------------//
  //------GLOBALS----------//
  //-----------------------//

  var DEBUG = true;
  var CONFIG = {
    canvasSize: 800,
    bgColor: "#E3F2FD",
    players: {
      radius: 25,
      color: "#BBDEFB"
    },
    bullets: {
      radius: 5,
      color: "black"
    },
  };

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
    self.bulletDamage = 15;
    self.kills = 0;
    self.inputs = {};

    var super_update = self.update;
    self.update = function() {
      self.updateVelocity();
      super_update();

      self.updateAngle();
      self.updateShootCooldown();
      self.updateShooting();
    }

    self.updateVelocity = function() {
      if(self.inputs[83]) { //S
        self.velY += self.acceleration;
        if(self.velY > self.maxSpeed) self.velY = self.maxSpeed;
      }
      if(self.inputs[68]) { //D
        self.velX += self.acceleration;
        if(self.velX > self.maxSpeed) self.velX = self.maxSpeed;
      }
      if(self.inputs[87]) { //W
        self.velY -= self.acceleration;
        if(self.velY < -self.maxSpeed) self.velY = -self.maxSpeed;
      }
      if(self.inputs[65]) { //A
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

    self.updateShooting = function() {
      if(self.inputs["mouse"])
        self.shoot();
    }

    self.shoot = function() {
      if(self.shootCooldown == 0) {
        for(var i = 0; i<self.shotAmount; i++){
          var angle = self.angle + (Math.random() * self.shotSpread - self.shotSpread/2);
          Bullet({
            x: self.x,
            y: self.y,
            angle: angle,
            shooterId: self.id,
            damage: self.bulletDamage
          });
        }
        ballNSP.emit('play_sound', {
          sound: "shoot",
          volume: 0.01,
        });
        self.shootCooldown = self.shootCooldownMax;
      }
    }

    self.onHit = function(data) {
      if(Math.random() < 0.1) {
        self.hp -= data.damage*2; //Random critical hit with double damage
        Indicator({playerId: self.id,value: "Critical: -" + data.damage*2,color: {r: 255,g: 255,b: 0}});
      } else {
        self.hp -= data.damage;
        Indicator({playerId: self.id,value: "-" + data.damage,color: {r: 255,g: 0,b: 0}});
      }

      if(self.hp <= 0) {
        self.hp = 100;
        self.x = Math.random()*CONFIG.canvasSize;
        self.y = Math.random()*CONFIG.canvasSize;
        ballNSP.emit('play_sound', {
          sound: "death",
          volume: 0.1,
        });
        Player.list[data.shooterId].kills++;
        if(Player.list[data.shooterId].kills%5 == 0) {
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
    self.damage = data.damage;

    var super_update = self.update;
    self.update = function() {
      super_update();
      self.checkCollision();
    }

    self.checkCollision = function() {
      for(var i in Player.list) {
        var player = Player.list[i];
        if(self.getDistanceTo({x: player.x, y: player.y}) < (CONFIG.players.radius+CONFIG.bullets.radius)) {
          if(self.shooterId != player.id) {
            delete Bullet.list[self.id];
            player.onHit({
              shooterId: self.shooterId,
              damage: self.damage
            });
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

  var Indicator = function(data) {
    var self = {
      x: 0,
      y: 0,
      id: Math.random(),
      playerId: data.playerId,
      value: data.value,
      fadedPercentage: 0,
      fadeHeight: 20,
      color: {
        r: data.color.r,
        g: data.color.g,
        b: data.color.b
      }
    }

    self.update = function() {
      self.fadedPercentage += 0.05;

      if(self.fadedPercentage >= 1){
        delete Indicator.list[self.id];
        return;
      }

      var player = Player.list[self.playerId];
      var height = self.fadeHeight * self.fadedPercentage + CONFIG.players.radius + 5;

      self.x = player.x;
      self.y = player.y - height;
    }

    Indicator.list[self.id] = self;
    return self;
  }
  Indicator.list = {};

  //-----------------------//
  //------EVENTS-----------//
  //-----------------------//

  var ballNSP = io.of('/BallGame');
  ballNSP.on('connection', function(socket){

    var player = Player(socket.id);

    socket.on('request_config', function(callback){
      callback(CONFIG);
    })

    socket.on('player_register_input', function(data){
      player.inputs[data.input] = data.pressed;
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
      bullets: {},
      indicators: {}
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

    for(var i in Indicator.list){
      var indicator = Indicator.list[i];

      indicator.update();

      data.indicators[indicator.id] = {
        x: indicator.x,
        y: indicator.y,
        value: indicator.value,
        fadedPercentage: indicator.fadedPercentage,
        color: indicator.color
      }
    }

    ballNSP.emit('render_all', data);
  },1000/64);

}
