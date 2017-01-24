//-----------------------//
//------OBJECTS----------//
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
  this.highScore = 0;
  this.gameState = "pregame";
  this.gameSpeed = 10;

  this.player = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
  }

}

Game.prototype = {

  init: function() {
    this.setup();
    this.registerMouse();
    this.player.texture = new Image();
    this.player.texture.src = "JS/Textures/Driver.png";
    this.render();
  },

  setup: function() {
    this.player.y = (this.c.height / 10) * 9;
    this.player.x = (this.c.width / 2);
    this.gameState = "pregame";
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
    this.render();
  },

  registerMouse: function() {
    var t = this;
    $(document).mousemove(function(e){
      var rect = t.c.getBoundingClientRect();
      t.player.x = (e.clientX-rect.left)/(rect.right-rect.left)*t.c.width-t.player.width/2;
      t.player.y = (e.clientY-rect.top)/(rect.bottom-rect.top)*t.c.height-t.player.height/2;

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
  },

}

var WallRunner;
$(document).ready(function(){
  WallRunner = new Game("display-game");
  WallRunner.init();
  WallRunner.start();
})

$(document).keydown(function(e) {
  var key = e.keyCode;
  switch(key) {
    case 32:
      if(WallRunner.gameState = "pregame") {
        WallRunner.start();
      } else if(WallRunner.gameState = "stopped") {
        WallRunner.setup();
      }
    break;
  }
})
