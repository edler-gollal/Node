
//-----------------------//
//------Ready-----------//
//-----------------------//

$(document).ready(function(){

  global.socket = io('/BallGame');
  loadVariables();

});

var global = {};

//-----------------------//
//------Init------------//
//-----------------------//

function loadVariables(){
  global.c = document.getElementById('display-game');
  global.ctx = global.c.getContext('2d');
  global.socket.emit('request_config', function(data){
    global.c.width = global.c.height = data.canvasSize;
    global.config = {
      bgColor: data.bgColor,
      players: {
        radius: data.players.radius,
        color: data.players.color
      },
      bullets: {
        radius: data.bullets.radius,
        color: data.bullets.color
      },
    };

    registerEvents();
  })
}

function registerEvents() {

  global.socket.on('console_log', function(msg){
    console.log(msg);
  })

  global.socket.on('render_all', function(data){
    clearScreen();
    renderBullets(data.bullets);
    renderPlayers(data.players);
    renderIndicators(data.indicators);
    renderScore(data.players);
  })

  global.socket.on('play_sound', function(data) {
    var audio = new Audio("/BallGame/Sounds/" + data.sound + ".mp3");
    audio.volume = data.volume;
    //audio.play();
  })

  $(document).keydown(function(e){
    global.socket.emit('player_register_input', {
      input: e.keyCode,
      pressed: true
    });
  })

  $(document).keyup(function(e){
    global.socket.emit('player_register_input', {
      input: e.keyCode,
      pressed: false
    });
  })

  $(document).mousemove(function(e){
    var rect = global.c.getBoundingClientRect();
    global.socket.emit('player_mouse_move', {
      x: (e.clientX-rect.left)/(rect.right-rect.left)*global.c.width,
      y: (e.clientY-rect.top)/(rect.bottom-rect.top)*global.c.height
    });
  })

  $(document).mousedown(function(e){
    global.socket.emit('player_register_input', {
      input: "mouse",
      pressed: true
    });
  })

  $(document).mouseup(function(e){
    global.socket.emit('player_register_input', {
      input: "mouse",
      pressed: false
    });
  })
}

//-----------------------//
//------Rendering--------//
//-----------------------//

function clearScreen() {
  global.ctx.beginPath();
  global.ctx.rect(0,0,global.c.width,global.c.height);
  global.ctx.fillStyle = global.config.bgColor;
  global.ctx.fill();
}

function renderCircle(x,y,radius,color,stroke) {
  global.ctx.beginPath();
  global.ctx.arc(x,y,radius,0,Math.PI*2);
  global.ctx.lineWidth = 1;
  if(stroke)
    global.ctx.stroke();
  global.ctx.fillStyle = color;
  global.ctx.fill();
}

function renderPlayers(data) {
  for(var i in data) {
    var player = data[i];
    var posX = player.x;
    var posY = player.y;

    toX = posX + (Math.cos(player.angle/180*Math.PI) * (global.config.players.radius + 5));
    toY = posY + (Math.sin(player.angle/180*Math.PI) * (global.config.players.radius + 5));

    global.ctx.beginPath();
    global.ctx.moveTo(posX,posY);
    global.ctx.lineTo(toX,toY);
    global.ctx.lineWidth = 7;
    global.ctx.stroke();

    renderCircle(posX,posY,global.config.players.radius,global.config.players.color,true);

    renderCircle(posX,posY,global.config.players.radius*((100-player.hp)/100),"red",false);
  }
}

function renderBullets(data) {
  for(var i in data) {
    var posX = data[i].x;
    var posY = data[i].y;
    renderCircle(posX,posY,global.config.bullets.radius,global.config.bullets.color,false);
  }
}

function renderIndicators(data) {
  for(var i in data) {
    var indicator = data[i];
    var alpha = 1 - indicator.fadedPercentage;
    global.ctx.fillStyle = "rgba(" + indicator.color.r + "," + indicator.color.g + "," + indicator.color.b + "," + alpha + ")";
    global.ctx.font = "20px Helvetica";
    global.ctx.fillText("" + indicator.value,indicator.x - global.ctx.measureText(indicator.value).width/2,indicator.y);
  }
}

function renderScore(data) {
  var y = 0;
  for(var i in data) {
    y += 10;
    var player = data[i];
    global.ctx.fillStyle = "black";
    global.ctx.font = "10px Helvetica";
    global.ctx.fillText(i + ": " + player.kills,5,y);
  }
}

//-----------------------//
//------Other------------//
//-----------------------//

function sudo (data) {
  global.socket.emit('eval_this', data);
}
