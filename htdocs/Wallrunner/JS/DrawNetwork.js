$(document).ready( function() {
  if(document.getElementById("display-network")!=null){
    loadVariables1();
  }
});

var c1;
var ctx1;
var neuronRadius;
var layerAmount;
var thisnetwork;

function loadVariables1() {
  //Definde canvas
  c1 = document.getElementById("display-network");
  ctx1 = c1.getContext("2d");

  //Set correct height and width of canvas
  c1.setAttribute("height", $('#display-network').height());
  c1.setAttribute("width", $('#display-network').width());
}

function loadNetworkVariables(network) {
  //Get amount of layers
  layerAmount = 2 + network.layers.hidden.length;

  //Set needed Neuron radius
  var hiddenLayerNeuronAmount = network.layers.hidden[0].neurons().length;
  neuronRadius = ((c1.height - 80 - hiddenLayerNeuronAmount*2*5) / hiddenLayerNeuronAmount) / 3;
}

function drawNetwork (network) {
  clearCanvas();
  thisnetwork = network;
  loadNetworkVariables(network);
  drawConnections(network);
  drawNeurons(network);
}

//Clear the canvas
function clearCanvas() {
  ctx1.clearRect(0, 0, c1.width, c1.height);
  ctx1.beginPath();
}

//Draw a single Neuron and show its ID
function drawNeuron (x,y,id) {
  //Draw circle
  ctx1.beginPath();
  ctx1.arc(x,y,neuronRadius,0,2*Math.PI);
  ctx1.strokeStyle = "black";
  ctx1.lineWidth = 1;
  ctx1.stroke();
  ctx1.fillStyle = getNeuronInfo(thisnetwork)[id][2];
  ctx1.fill();

  //Write Text
  ctx1.fillStyle = "black";
  ctx1.font = neuronRadius/3 + "px Georgia";
  ctx1.fillText (id,x-neuronRadius/8,y+neuronRadius/8);
}

function drawLine (fr,to,weight) {
  var truefr = translateNeuronID(thisnetwork,fr);
  var trueto = translateNeuronID(thisnetwork,to)
  var fromPos = getNeuronInfo(thisnetwork)[truefr];
  var toPos = getNeuronInfo(thisnetwork)[trueto];

  ctx1.beginPath();
  ctx1.moveTo(fromPos[0],fromPos[1]);
  var width = Math.abs(weight) + 0.2;
  if(width > 3) width = 3;
  ctx1.lineWidth = width;
  ctx1.lineTo(toPos[0],toPos[1]);

  var ranColor = parseInt(Math.random() * 155)+50;
  var color = "rgb(" + ranColor + "," + ranColor + "," + ranColor + ")";
  ctx1.strokeStyle = color;
  ctx1.stroke();

  ctx1.fillStyle = "black";
  ctx1.font = neuronRadius/3 + "px Georgia";
  //ctx1.fillText (weight,fromPos[0]+(toPos[0]-fromPos[0])/3,fromPos[1]+(toPos[1]-fromPos[1])/3);
}

//Draw connections between neurons
function drawConnections (network) {
  for (var i = 0; i < getNeuronInfo(thisnetwork).length; i++) {
    var connections = network.neurons()[i].neuron.connections.projected;
    for (var key in connections) {
      var connection = connections[key];
      var toID = connection.to.ID;
      //connection.weight = Math.random() * 0.1;
      drawLine(network.neurons()[i].neuron.ID,toID,connection.weight);
    }
  }
}

function setWeight(network,id,weight) {
  var neuron = network.neurons()[id].neuron;
  var connections = neuron.connections.projected;
  for (var key in connections) {
    var connection = connections[key];
    //connection.weight *= Math.random() * .2 - .1;
    connection.weight = weight;
  }
  network.optimized.reset()
}

//Draw the input layer
function drawNeurons () {
  for (var i = 0; i < getNeuronInfo(thisnetwork).length; i++) {
    var neuronInfo = getNeuronInfo(thisnetwork)[i];
    drawNeuron(neuronInfo[0],neuronInfo[1],i);
  }
}

function translateNeuronID(network, id) {
  var neurons = network.neurons();
  for (var i = 0; i<neurons.length; i++) {
    var neuronID = neurons[i].neuron.ID;
    if(neuronID == id){
      return i;
    }
  }
}

function getNeuronInfo(network) {
  var inputLayerPositions = getInputLayerPositions(network);
  var hiddenLayerPositions = getHiddenLayerPositions(network);
  var outputLayerPositions = getOutputLayerPositions(network);
  var neuronInfo = [];
  neuronInfo = neuronInfo.concat(inputLayerPositions);
  neuronInfo = neuronInfo.concat(hiddenLayerPositions);
  neuronInfo = neuronInfo.concat(outputLayerPositions);
  return neuronInfo;
}

function getInputLayerPositions(network) {
  var neurons = network.layers.input.neurons();
  var neuronAmount = neurons.length;
  var neuronInfoReturn = [];
  for (var i = 0; i < neuronAmount; i++) {
    var x = 40;
    var y = 45 + i*2*5 + neuronRadius*2*i + neuronRadius*(i+1);
    neuronInfoReturn = neuronInfoReturn.concat([[x,y,"#E53935"]])
  }
  return neuronInfoReturn;
}

function getHiddenLayerPositions(network) {
  var hiddenLayers = network.layers.hidden;
  var hiddenLayersAmount = hiddenLayers.length;
  var neuronInfoReturn = [];
  for (var l = 0; l < hiddenLayersAmount; l++) {
    var neurons = network.layers.hidden[l].neurons();
    var neuronAmount = neurons.length;
    for (var i = 0; i < neuronAmount; i++) {
      var x = 40 + (c1.width/layerAmount)*(l+1);
      var y = 45 + i*2*5 + neuronRadius*2*i + neuronRadius*(i+1);
      neuronInfoReturn = neuronInfoReturn.concat([[x,y,"#42A5F5"]])
    }
  }
  return neuronInfoReturn;
}

function getOutputLayerPositions(network) {
  var neurons = network.layers.output.neurons();
  var neuronAmount = neurons.length;
  var neuronInfoReturn = [];
  for (var i = 0; i < neuronAmount; i++) {
    var x = 40 + (c1.width/layerAmount)*(network.layers.hidden.length + 1);
    var y = 45 + i*2*5 + neuronRadius*2*i + neuronRadius*(i+1);
    neuronInfoReturn = neuronInfoReturn.concat([[x,y,"#00897B"]])
  }
  return neuronInfoReturn;
}
