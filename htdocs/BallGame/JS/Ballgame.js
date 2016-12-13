
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
  global.c.width = window.innerWidth;
  global.c.height = window.innerHeight;

  global.config.bgColor = "#E3F2FD";
  global.config = {};
  global.config.radius = parseInt(global.c.width/50);
  global.config.color = "#BBDEFB";
  global.others = {};
}

function registerEvents() {

  global.socket.on('set_player_id', function(id){
    global.id = id;
  })

  global.socket.on('console_log', function(msg){
    console.log(msg);
  })

  global.socket.on('render_players', function(data){
    clearScreen();
    renderPlayers(data);
  })

}

//-----------------------//
//-----Keybinds----------//
//-----------------------//

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

//-----------------------//
//------Rendering--------//
//-----------------------//

function clearScreen() {
  global.ctx.beginPath();
  global.ctx.rect(0,0,global.c.width,global.c.height);
  global.ctx.fillStyle = global.config.bgColor;
  global.ctx.fill();
}

function renderPlayer(x,y,r,c){
  global.ctx.beginPath();
  global.ctx.arc(x,y,r,0,Math.PI*2);
  global.ctx.stroke();
  global.ctx.fillStyle = c;
  global.ctx.fill();
}

function renderPlayers(data) {
  for(var player in data) {
    var posX = parseInt(global.c.width * data[player].x);
    var posY = parseInt(global.c.height * data[player].y);
    renderPlayer(posX,posY,global.playerCfg.radius,global.playerCfg.color);
  }
}
