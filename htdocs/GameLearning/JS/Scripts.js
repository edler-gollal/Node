"use strict";

//Implement Synaptic
var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

$(document).ready( function() {
  $('#display').height($(window).height() * 0.9);

  $('#startLearning').mousedown(function() {
    document.getElementById('log').innerHTML = "";
    var hl = document.getElementById('hiddenLayers').value;
    var gs = document.getElementById('generationSize').value;
    startLearning(hl,gs);
  });

  (function () {
      var old = console.log;
      var logger = document.getElementById('log');
      console.log = function (message) {
          if (typeof message == 'object') {
              logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
          } else if(message == " ") {
              logger.innerHTML += '<br />';
          } else if(message == "line") {
              logger.innerHTML += '<hr size="1" color="green">';
          } else {
              logger.innerHTML += '<span class="log-message">' + message + '</span>';
          }
          var loggerContainer = document.getElementById('display-log')
          loggerContainer.scrollTop = loggerContainer.scrollHeight;
      }
  })();

  startMessage();
});

function sortNumber(a,b) {
  return b[0] - a[0];
}

function startMessage(){
  console.log("An artificial neural network learns to play a game using a genetic algorithm.");
  console.log("line");
  console.log("Controls:");
  console.log("Start Game: Spacebar");
  console.log("Jump: Up arrow");
  console.log("Duck: Down arrow");
  console.log("Start Gamelearning: Press 'Start Learning'");
  console.log("line");
  console.log("You can also configure network and algorithm in the section above.")
  console.log("Enjoy!");
}
