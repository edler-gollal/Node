
//-----------------------//
//------Ready-----------//
//-----------------------//

$(document).ready(function(){

  global.socket = io('/BallGame');
  loadVariables();
  registerEvents();

  clearScreen();

});

var global = {};

//-----------------------//
//------Init------------//
//-----------------------//

function loadVariables(){
  global.c = document.getElementById('display-game');
  global.ctx = global.c.getContext('2d');
  global.c.width = global.c.height = 800;

  global.config = {
    bgColor: "#E3F2FD",
    players: {
      radius: parseInt(global.c.width/60),
      color: "#BBDEFB"
    },
    bullets: {
      radius: parseInt(global.c.width/300),
      color: "black"
    },
  };
}

function registerEvents() {

  global.socket.on('set_player_id', function(id){
    global.id = id;
  })

  global.socket.on('console_log', function(msg){
    console.log(msg);
  })

  global.socket.on('render_all', function(data){
    clearScreen();
    renderBullets(data.bullets);
    renderPlayers(data.players);
  })

  $(document).keydown(function(e){
    global.socket.emit('player_key_press', {
      key: e.keyCode,
      pressed: true
    });
  })

  $(document).keyup(function(e){
    global.socket.emit('player_key_press', {
      key: e.keyCode,
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
    global.socket.emit('player_shoot');
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

function renderCircle(x,y,r,c) {
  global.ctx.beginPath();
  global.ctx.arc(x,y,r,0,Math.PI*2);
  global.ctx.lineWidth = 1;
  global.ctx.stroke();
  global.ctx.fillStyle = c;
  global.ctx.fill();
}

function renderPlayers(data) {
  for(var player in data) {
    var pData = data[player];
    var posX = pData.x;
    var posY = pData.y;

    toX = posX + (Math.cos(pData.angle/180*Math.PI) * 18);
    toY = posY + (Math.sin(pData.angle/180*Math.PI) * 18);

    global.ctx.beginPath();
    global.ctx.moveTo(posX,posY);
    global.ctx.lineTo(toX,toY);
    global.ctx.lineWidth = 7;
    global.ctx.stroke();

    renderCircle(posX,posY,global.config.players.radius,global.config.players.color);
  }
}

function renderBullets(data) {
  for(var bullet in data) {
    var posX = data[bullet].x;
    var posY = data[bullet].y;
    renderCircle(posX,posY,global.config.bullets.radius,global.config.bullets.color);
  }
}

//-----------------------//
//------Other------------//
//-----------------------//

function sudo (data) {
  global.socket.emit('eval_this', data);
}
