
//-----------------------//
//------Ready-----------//
//-----------------------//

$(document).ready(function(){

  global.socket = io('/BallGame');
  loadVariables();
  registerEvents();

  setTimeout(function() {
    setupGame();
    render();
    global.gameRunning = true;
    runGame();
  },1000);

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

  global.backgroundColor = "#E3F2FD";
  global.player = {};
  global.player.radius = parseInt(global.c.width/50);
  global.player.color = "#BBDEFB";
  global.others = {};
}

function registerEvents() {
  global.socket.on('set_player_position', function(player,x,y){
    if(player == -1) {
      console.log("Randomizing: " + x + "," + y);
      var posX = parseInt(global.c.width * x);
      var posY = parseInt(global.c.height * y);
      global.player.x = posX;
      global.player.y = posY;
    } else {
      if(global.others[player] == undefined) global.others[player] = {};
      global.others[player].x = x;
      global.others[player].y = y;
    }
  })

  global.socket.on('set_player_id', function(id){
    global.player.id = id;
  })

  global.socket.on('console_log', function(msg){
    console.log(msg);
  })

  global.socket.on('player_disconnect', function(id){
    delete global.others[id];
  })

  // $(document).touchstart(function(e){
  //   global.socket.emit('console_log', "Touch");
  // })

}

//-----------------------//
//------Game-------------//
//-----------------------//

function setupGame(){
  global.gameRunning = false;
  global.socket.emit('get_player_position',-1,true);
}

function runGame(){
  global.socket.emit('request_other_positions',global.player.id)
  render();

  if(global.gameRunning) {
    setTimeout(function() {
      runGame();
    }, 10);
  }
}

function movePlayer(dir) {
  if(global.gameRunning){
    if(dir == "up") {
      global.player.y -= 3;
    } else if(dir == "left") {
      global.player.x -= 3;
    } else if(dir == "down") {
      global.player.y += 3;
    } else if(dir == "right") {
      global.player.x += 3;
    }
    global.socket.emit('update_player_position',parseInt((global.player.x/global.c.width)*1000),parseInt((global.player.y/global.c.height)*1000));
  }
}

//-----------------------//
//-----Keybinds----------//
//-----------------------//

$(document).keydown(function(e){
  var key = e.keyCode;
  switch(key) {
    case 87: //W
      movePlayer("up");
    break;
    case 65: //A
      movePlayer("left");
    break;
    case 83: //S
      movePlayer("down");
    break;
    case 68: //D
      movePlayer("right");
    break;
  }
})


//-----------------------//
//------Rendering--------//
//-----------------------//

function render() {
  clear();
  renderPlayer(global.player.x,global.player.y,global.player.radius,global.player.color);
  renderOthers();
}

function clear() {
  global.ctx.beginPath();
  global.ctx.rect(0,0,global.c.width,global.c.height);
  global.ctx.fillStyle = global.backgroundColor;
  global.ctx.fill();
}

function renderPlayer(x,y,r,c){
  global.ctx.beginPath();
  global.ctx.arc(x,y,r,0,Math.PI*2);
  global.ctx.stroke();
  global.ctx.fillStyle = c;
  global.ctx.fill();
}

function renderOthers() {
  for(var key in global.others) {
    if(global.others.hasOwnProperty(key)) {
      var posX = parseInt(global.c.width * global.others[key].x);
      var posY = parseInt(global.c.height * global.others[key].y);
      renderPlayer(posX,posY,global.player.radius,global.player.color);
    }
  }
}
