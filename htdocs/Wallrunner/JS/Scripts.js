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
  console.log("cooooooool.");
}
