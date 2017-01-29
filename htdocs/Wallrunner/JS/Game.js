//-----------------------//
//------Game Object------//
//-----------------------//

function Game(canvasName) {

  this.canvasName = canvasName,
  this.c = document.getElementById(this.canvasName);
  this.ctx = this.c.getContext("2d");
  this.c.setAttribute("height", $('#' + this.canvasName).height());
  this.c.setAttribute("width", $('#' + this.canvasName).width());

  this.colors = {
    bgColor: "#fff",
    objectColor: "#80CBC4",
    textColor: "#00796B",
    outlineColor: "#4DB6AC"
  }

  this.score = 0;
  this.tick = 0;
  this.highScore = 0;
  this.gameState = "pregame";
  this.gameSpeed = 10;
  this.obstacleDelay = 70;

  this.player = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
  }
  this.player.texture = new Image();
  this.player.texture.src = "JS/Textures/Player.png";

  this.isLearning = false;
  this.networkInput = [];
  this.networkOutput = [];

  return this;
}

Game.prototype = {

  init: function() {
    this.setup();
    this.registerMouse();
    this.render();
  },

  setup: function() {
    this.player.y = (this.c.height / 10) * 8;
    this.player.x = (this.c.width / 2) - this.player.width;

    for(var o in Obstacle.list){
      Obstacle.list[o].delete();
    }

    this.score = 0;
    this.tick = 0;
    this.gameState = "pregame";

    this.render();
  },

  start: function() {
    this.gameState = "running";
    var t = this;
    this.gameInterval = setInterval(function(){t.update();},this.gameSpeed);
  },

  stop: function() {
    this.gameState = "stopped"
    clearInterval(this.gameInterval);
  },

  update: function() {
    this.tick++;

    if(this.tick%this.obstacleDelay == 0)
      var newObstacle = new Obstacle(this);

    if(this.score > this.highScore)
      this.highScore = this.score;

    this.updateObstacles();
    this.checkPlayerCollision();
    this.render();
  },

  updateObstacles: function() {
    for(var o in Obstacle.list){
      Obstacle.list[o].update();
    }
  },

  checkPlayerCollision: function() {
    for(var o in Obstacle.list){
      var obstacle = Obstacle.list[o];
      if((this.player.y <= obstacle.y+obstacle.height)&&!(this.player.y+this.player.height < obstacle.y)){
        if((this.player.x < obstacle.gapLeftX) || (this.player.x+this.player.width > obstacle.gapRightX)){
          this.stop();
        }
      }
    }
  },

  registerMouse: function() {
    var t = this;
    $(document).mousemove(function(e){
      var rect = t.c.getBoundingClientRect();
      if(!this.isLearning) {
        t.player.x = (e.clientX-rect.left)/(rect.right-rect.left)*t.c.width-t.player.width/2;
        //t.player.y = (e.clientY-rect.top)/(rect.bottom-rect.top)*t.c.height-t.player.height/2;
      }

      if(t.player.x < 0) t.player.x = 0;
      if(t.player.x > t.c.width-t.player.width) t.player.x = t.c.width-t.player.width;
      if(t.player.y < 0) t.player.y = 0;
      if(t.player.y > t.c.height-t.player.height) t.player.y = t.c.height-t.player.height;
    })
  },

  render: function() {
    //Clear
    this.ctx.beginPath();
    this.ctx.rect(0,0,this.c.width,this.c.height);
    this.ctx.fillStyle = this.colors.bgColor;
    this.ctx.fill();

    //Render Player
    this.ctx.drawImage(this.player.texture,this.player.x,this.player.y,this.player.width,this.player.height);

    //Render Obstacles
    for(var o in Obstacle.list){
      Obstacle.list[o].render();
    }

    //Render Score
    this.ctx.fillStyle = "orange";
    this.ctx.font = "20px Helvetica";
    this.ctx.fillText ("Score: " + this.score + " Highscore: " + this.highScore,5,22);

    //Render Network output
    this.ctx.font = "10px Helvetica";
    var text = "Output: " + this.networkOutput[0];
    this.ctx.fillText(text,this.c.width-5-this.ctx.measureText(text).width,this.c.height-10);

    //Render Network input
    var text = "Input: " + this.networkInput[0] + ", " + this.networkInput[1] + ", " + this.networkInput[2];
    this.ctx.fillText(text,this.c.width-5-this.ctx.measureText(text).width,22);
  },

  getNetworkInputs: function() {
    var nextObstacle = {
      ticksLived: 0,
    }
    for(var o in Obstacle.list){
      var distance = this.player.y-Obstacle.list[o].y;
      if(distance > 0) {
        if(Obstacle.list[o].ticksLived > nextObstacle.ticksLived) {
          nextObstacle = Obstacle.list[o];
        }
      }
    }

    if(nextObstacle == null) {
      var input = [100,100,200];
    } else {
      var distance = this.player.y-nextObstacle.y;
      var input = [distance,nextObstacle.gapLeftX,nextObstacle.gapRightX]
    }

    this.networkInput = input;
    return input;
  }

}

//-----------------------//
//--Obstacle Object------//
//-----------------------//

function Obstacle(game) {

  this.id = Math.random();
  this.y = -50;
  this.height = 80;
  this.speed = 7;
  this.ticksLived = 0;
  this.game = game;
  this.gapSize = this.game.player.width * 2.5;

  this.texture = new Image();
  this.texture.src = "JS/Textures/Obstacle.png";

  this.gapLeftX = parseInt(Math.random() * (this.game.c.width - this.gapSize));
  if(game.score == 0)
    this.gapLeftX = game.player.x + game.player.width*2;
  this.gapRightX = this.gapLeftX + this.gapSize;

  Obstacle.list[this.id] = this;
  return this;

}

Obstacle.prototype = {

  update: function() {
    this.y += this.speed;
    this.ticksLived++;

    if(this.y > this.game.player.y+this.game.player.height) {
      if(!this.passedThrough) {
        this.game.score++;
        this.passedThrough = true;
      }
    }

    if(this.y > this.game.c.height + 50) {
      this.delete();
    }
  },

  render: function() {
    var pat = this.game.ctx.createPattern(this.texture,"repeat");
    this.game.ctx.fillStyle = pat;
    this.game.ctx.strokeStyle = "black";

    //Left Part
    this.game.ctx.beginPath();
    this.game.ctx.rect(0,this.y,this.gapLeftX,this.height);
    this.game.ctx.fill();
    this.game.ctx.stroke();

    //Right Part
    this.game.ctx.beginPath();
    this.game.ctx.rect(this.gapRightX,this.y,this.game.c.width-this.gapRightX,this.height);
    this.game.ctx.fill();
    this.game.ctx.stroke();
  },

  delete: function() {
    delete Obstacle.list[this.id];
  }

}
Obstacle.list = {};

//-----------------------//
//------Init-------------//
//-----------------------//

var WallRunner;
$(document).ready(function(){
  WallRunner = new Game("display-game");
  WallRunner.init();
})

//-----------------------//
//------Events-----------//
//-----------------------//

$(document).keydown(function(e) {
  var key = e.keyCode;
  switch(key) {
    case 32:
      if(WallRunner.gameState == "stopped") {
        WallRunner.setup();
        WallRunner.start();
      } else if(WallRunner.gameState == "pregame") {
        WallRunner.start();
      }
    break;
  }
})
