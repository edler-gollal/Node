"use strict";

$(document).ready( function() {
  if(document.getElementById("display-game")!=null){
    loadVariables2();
    setupGame();
  }
});

var c2;
var ctx2;
var platformHeight;
var playerPositionX;
var bgColor = "#B2DFDB";
var objectColor = "#80CBC4";
var textColor = "#00796B";
var outlineColor = "#4DB6AC";
var score;
var highScore = 0;
var counter;
var player;
var obstacle;
var gameState = "pregame";
var nextObstacle;
var networkOutput = [0,0];
var learningState = [0,0,0];
var gameSpeed;
var tryNumber = 0;
var isLearning = false;

var speed;
var distance;

function loadVariables2() {
  c2 = document.getElementById("display-game");
  ctx2 = c2.getContext("2d");
  c2.setAttribute("height", $('#display-game').height());
  c2.setAttribute("width", $('#display-game').width());
  platformHeight = (c2.height / 3) * 2;
  playerPositionX = c2.width / 5;
  player = {
    width: 10,
    height: 30,
    y: 0,
    ySpeed: 0,
    x: playerPositionX,
    realY: function() { return platformHeight-this.height-this.y; },
    midAir: false,
    doubleJumped: false,
    ducking: false,
    jump: function() {
      if(this.midAir) {
        if(this.doubleJumped == "feature disabled") {
          this.doubleJumped = true;
          this.ySpeed += 40;
        }
      } else {
        this.midAir = true;
        this.ySpeed += 25;
        if(score == 0){
          this.preObstacleJumpAmount++;
        }
      }
    },
    preObstacleJumpAmount: 0
  }
  obstacle = {
    type: 0, //0 -> Disabled, 1 -> Jumping Obstacle, 2 -> Ducking Obstacle
    width: 20,
    height: 0,
    x: -25,
    first: true,
    y: 0,
    realY: function() { return platformHeight-this.height-this.y; }
  }
}

//Functions for running the game
function setupGame() {
  score = 0;
  counter = 0;
  player.y = 0;
  player.ySpeed = 0;
  player.preObstacleJumpAmount = 0;
  nextObstacle = -1;
  obstacle.x = -25;
  speed = 10;
  obstacle.type = 0;
  obstacle.first = true;
  gameSpeed = document.getElementById('gameSpeed').value;
  renderGame();
  distance = 100;
  tryNumber++;
}
function game() {
  counter++;
  updatePlayerPosition();
  updateObstaclePosition();
  renderGame();

  speed = 10 + parseInt(counter/100)
  distance = (obstacle.x - player.x) / 5;
  if(distance < -10) distance = 100;
  if(distance > 100) distance = 100;

  if (counter==50) nextObstacle = 0;
  if (nextObstacle > 0) nextObstacle--;
  if (nextObstacle == 0) {
    nextObstacle = -1;
    createNewObstacle();
  }

  if (isColliding()) {
    gameState = "pregame";
    if(score > highScore){
      highScore = score;
    }
    if(!isLearning){
      console.log("Try " + tryNumber + " is over, score: " + score);
      setupGame();
    }
  }

  if(gameState == "running") {
    setTimeout(game,gameSpeed);
  }
}

//Functions for Game mechanics
function updatePlayerPosition() {
  player.ySpeed -= 2;
  player.y += player.ySpeed;
  if(player.y < 0) {
    player.y = 0;
    player.ySpeed = 0;
    player.midAir = false;
    player.doubleJumped = false;
  }
}

function updateObstaclePosition() {
  if(obstacle.type != 0) {
    obstacle.x -= speed;
    if (obstacle.x < -30) {
      obstacle.type = 0;
      nextObstacle = parseInt(Math.random() * 30) + 10;
    }
  }
}

function createNewObstacle() {
  score++;
  obstacle.type = parseInt(Math.random() * 2) + 1;
  if(obstacle.first) {
    obstacle.type = 1;
    obstacle.first = false;
    score--;
    if(player.preObstacleJumpAmount > 0) {
      obstacle.type = 2;
    }
  }
  obstacle.x = c2.width + 10;
  if(obstacle.type == 1) {
    obstacle.y = 0;
    obstacle.height = 50;
  } else {
    obstacle.y = player.height/2 + 5;
    obstacle.height = 200;
  }
}

function isColliding() {
  if((player.x+player.width >= obstacle.x)&&!(player.x > obstacle.x+obstacle.width)) {
    var playerHeight = player.height;
    if(player.ducking) {
      playerHeight /= 2;
    }
    if((player.y <= obstacle.y+obstacle.height)&&!(player.y+playerHeight < obstacle.y)){
      return true;
    }
  }
}

//Functions for Drawing stuff on Display
function renderGame () {
  drawBG();
  drawPlatform();
  drawPlayer();
  drawObstacle();
  drawScore();
  drawGameState();
  if(isLearning){
    drawInputs();
    drawOutput();
    drawLearningState();
  }
}
function drawBG () {
  ctx2.beginPath();
  ctx2.rect(0,0,c2.width,c2.height);
  ctx2.fillStyle = bgColor;
  ctx2.fill();
}
function drawPlatform() {
  ctx2.beginPath();
  ctx2.rect(-10,platformHeight,c2.width+20,20);
  ctx2.fillStyle = objectColor;
  ctx2.fill();

  ctx2.beginPath();
  ctx2.moveTo(-10,platformHeight-1);
  ctx2.lineWidth = 1;
  ctx2.lineTo(c2.width+10,platformHeight-1);
  ctx2.stroke();
}
function drawPlayer() {
  if(!player.ducking) {
    ctx2.beginPath();
    ctx2.rect(player.x,player.realY(),player.width,player.height);
    ctx2.fillStyle = objectColor;
    ctx2.fill();

    ctx2.beginPath();
    ctx2.moveTo(player.x,player.realY());
    ctx2.lineWidth = 1;
    ctx2.lineTo(player.x+player.width,player.realY());
    ctx2.stroke();
  } else {
    //body
    ctx2.beginPath();
    ctx2.rect(player.x-player.width/2,player.realY()+player.height/2,player.width,player.height/2);
    ctx2.fillStyle = objectColor;
    ctx2.fill();

    //head
    ctx2.beginPath();
    ctx2.rect(player.x,player.realY()+player.height/2,player.width,player.height/4);
    ctx2.fillStyle = objectColor;
    ctx2.fill();

    ctx2.beginPath();
    ctx2.moveTo(player.x-player.width/2,player.realY()+player.height/2);
    ctx2.lineWidth = 1;
    ctx2.lineTo(player.x+player.width,player.realY()+player.height/2);
    ctx2.stroke();
  }
}
function drawScore() {
  ctx2.fillStyle = textColor;
  ctx2.font = "20px Helvetica";
  ctx2.fillText ("Score: " + score + " Highscore: " + highScore,5,22);
}
function drawGameState() {
  ctx2.fillStyle = textColor;
  ctx2.font = "20px Helvetica";
  var text = "Gamestate: " + gameState;
  ctx2.fillText(text,c2.width-5-ctx2.measureText(text).width,22);
}
function drawObstacle() {
  ctx2.beginPath();
  ctx2.rect(obstacle.x,obstacle.realY(),obstacle.width,obstacle.height);
  ctx2.fillStyle = objectColor;
  ctx2.fill();

  ctx2.beginPath();
  ctx2.moveTo(obstacle.x,obstacle.realY());
  ctx2.lineWidth = 1;
  ctx2.lineTo(obstacle.x+obstacle.width,obstacle.realY());
  ctx2.stroke();
}
function drawOutput() {
  ctx2.fillStyle = textColor;
  ctx2.font = "10px Helvetica";
  var text = "Output: " + networkOutput[0];
  ctx2.fillText(text,c2.width-5-ctx2.measureText(text).width,c2.height-10);
}
function drawInputs() {
  var inputWidth = 145;
  ctx2.beginPath();
  ctx2.rect(c2.width-inputWidth-5,40,inputWidth,12);
  ctx2.rect(c2.width-inputWidth-5,60,inputWidth,12);
  ctx2.rect(c2.width-inputWidth-5,80,inputWidth,12);
  ctx2.fillStyle = textColor;
  ctx2.fill();

  ctx2.fillStyle = textColor;
  ctx2.font = "10px Helvetica";
  ctx2.fillText("Distance",c2.width-inputWidth-10-ctx2.measureText("Distance").width,50);
  ctx2.fillText("Speed",c2.width-inputWidth-10-ctx2.measureText("Speed").width,70);
  ctx2.fillText("Type",c2.width-inputWidth-10-ctx2.measureText("Type").width,90);

  ctx2.beginPath();
  var distancePercentage = (distance / 100) * (inputWidth-4);
  ctx2.rect(c2.width-distancePercentage-7,42,distancePercentage,8);
  var speedPercentage = (speed / 100) * (inputWidth-4);
  ctx2.rect(c2.width-speedPercentage-7,62,speedPercentage,8);
  var typePercentage = (obstacle.type / 2) * (inputWidth-4);
  ctx2.rect(c2.width-typePercentage-7,82,typePercentage,8);
  ctx2.fillStyle = objectColor;
  ctx2.fill();
}
function drawLearningState() {
  ctx2.fillStyle = textColor;
  ctx2.font = "20px Helvetica";
  ctx2.fillText ("Learning: Generation " + learningState[0] + " (Genome " + learningState[1] + "/" + learningState[2] + ")",5,c2.height-10);
}

//Keyboard Controls
$(document).keydown(function(e) {
  var key = e.keyCode;
  switch(key) {
    case 38:
      player.jump();
    break;
    case 40:
      player.ducking = true;
    break;
    case 32:
      if((tryNumber == 1) && !(isLearning)){
        document.getElementById('log').innerHTML = "";
      }
      if(gameState=="pregame"){
        gameState = "running";
        game();
      } else if(gameState=="running"){
        gameState = "paused";
      } else if(gameState=="paused"){
        gameState = "running";
        game();
      }
      renderGame();
    break;
  }
})

$(document).keyup(function(e) {
  if(e.keyCode == 40) {
    player.ducking = false;
  }
})
