

generations = 0;
var currentNetwork;
var currentNetworkID = 0;
var currentGeneration = [];
var generationSize = 12;
var hiddenLayers = 4;

function startLearning(hl,gs) {
  if(hl != null) hiddenLayers = hl;
  if(gs != null) generationSize = gs;

  isLearning = true;

  if(gameState == "pregame") {
    gameState = "running";
    newGeneration(generationSize);
    currentNetwork = currentGeneration[0][1];
    game();
    learning();

    $('#learning-input').addClass('hidden');
    $('#display-input').css('height', '18.33%');
    $('#display-log').css({'height': '48.33%','top': '51.66%'});
    $('#saveNetwork').removeClass('hidden');
    $('#importGoodNetwork').removeClass('hidden');
  } else {
    console.log("Gamestate must be Pregame");
  }
}

function learning () {
  if(gameState == "pregame") {
    currentGeneration[currentNetworkID][0] = score;
    console.log("Genome " + (currentNetworkID+1) + " finished, fitness: " + score);
    //updateData();
    nextNetwork();
    setupGame();
    gameState = "running";
    game();
  }

  var output = currentNetwork.activate([distance,obstacle.type,speed]);
  controlGameByOutput(output);
  networkOutput = output;
  learningState = [generations,currentNetworkID+1,generationSize];

  setTimeout(learning,gameSpeed);
}

function newGeneration() {
  currentNetworkID = 0;
  generations++;
  console.log("Building Generation " + generations + "...");

  if(currentGeneration.length == 0) {
    for (var i = 0; i<generationSize; i++) {
      var network = newNetwork();
      currentGeneration.push([0,network]);
    }
  } else {
    selectBest(parseInt(generationSize/5)+1);
    var best = _.clone(currentGeneration);
    while (currentGeneration.length < generationSize - 2) {
      var genome1 = _.sample(best)[1].toJSON();
      var genome2 = _.sample(best)[1].toJSON();
      var newGenome = crossOver(genome1,genome2);
      mutateGenome(newGenome);
      currentGeneration.push([0,Network.fromJSON(newGenome)]);
    }
    while (currentGeneration.length < generationSize) {
      var genome = _.sample(best)[1].toJSON();
      var newGenome = _.clone(genome);
      mutateGenome(newGenome);
      currentGeneration.push([0,Network.fromJSON(newGenome)]);
    }
  }
  drawNetwork(currentGeneration[0][1]);
  console.log("Starting tests for Generation " + generations + "...");
  console.log(" ");
}

function nextNetwork() {
  currentNetworkID++;
  if(currentNetworkID == generationSize) {
    currentGeneration.sort(sortNumber);
    console.log(" ");
    console.log("Generation " + generations + " finished, best fitness: " + currentGeneration[0][0]);
    if((currentGeneration[0][0] == 0)&&(highScore == 0)){
      console.log("Bad generation, randomizing next one.");
      currentGeneration = [];
    }
    console.log(" ");
    console.log("line");
    console.log(" ");
    newGeneration();
  } else {
    currentNetwork = currentGeneration[currentNetworkID][1];
    drawNetwork(currentNetwork);
  }
}
function selectBest(amount){
  while(currentGeneration.length > amount) {
    currentGeneration.pop();
  }
  var newGeneration = [];
  for(var key in currentGeneration){
    if(currentGeneration[key][0] != 0){
      newGeneration.push(currentGeneration[key]);
    }
  }
}
function controlGameByOutput(output) {
  if(output[0] > 0.5) {
    player.jump();
    player.ducking = false;
  }
  if(output[0] < 0.5){
    player.ducking = true;
  }
}
function newNetwork() {
  var inputLayer = new Layer(3);
  var hiddenLayer = new Layer(hiddenLayers);
  var hiddenLayer2 = new Layer(hiddenLayers);
  var outputLayer = new Layer(1);
  inputLayer.project(hiddenLayer);
  hiddenLayer.project(hiddenLayer2);
  hiddenLayer2.project(outputLayer);
  var network = new Network ({
    input: inputLayer,
    hidden: [hiddenLayer,hiddenLayer2],
    output: outputLayer
  });
  return network;
}

//The following part was mainly written by Ivan Seidel and copied
//https://github.com/ivanseidel/IAMDinosaur

function crossOver(genome1,genome2) {
  if (Math.random() > 0.5) {
    var temp = genome1;
    genome1 = genome2;
    genome2 = temp;
  }
  genome1 = _.cloneDeep(genome1);
  genome2 = _.cloneDeep(genome2);

  neurons1 = genome1.neurons;
  neurons2 = genome2.neurons;

  var ran = Math.round(neurons1.length * Math.random());
  var tmp;
  for (var k = ran; k < neurons1.length; k++) {
    tmp = neurons1[k]['bias'];
    neurons1[k]['bias'] = neurons2[k]['bias'];
    neurons2[k]['bias'] = tmp;
  }
  return genome1;
}
function mutateGenome(genome) {
  var neurons = genome.neurons;
  for (var k = 0; k < neurons.length; k++) {
    if (Math.random() > 0.2) {
      continue;
    }
    neurons[k]['bias'] += neurons[k]['bias'] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);
  }
  var connections = genome.connections;
  for (var k = 0; k < connections.length; k++) {
    if (Math.random() > 0.2) {
      continue;
    }
    connections[k]['weight'] += connections[k]['weight'] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);
  }
}

//End of Ivan Seidel's code

function setFitness(id,fitness) {
  currentGeneration[id-1][0] = fitness;
}
function importGoodNetwork(id) {
  if(id < currentNetworkID){
    console.log("Network " + id + " was already tested, wait for next Generation and try again");
    return;
  } else if (hiddenLayers != 10) {
    console.log("The good network can only be imported for Tests running with 10+ hidden-layer Neurons");
    return;
  }

  var goodNetworkString = prompt("Insert stringified network (Leave blank to get a default good network)");
  if(goodNetworkString == "") {
    goodNetworkString = '{"neurons":[{"trace":{"elegibility":{},"extended":{}},"state":0,"old":0,"activation":6.039999999999997,"bias":0,"layer":"input","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":0,"old":0,"activation":1,"bias":0,"layer":"input","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":0,"old":0,"activation":31,"bias":0,"layer":"input","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-41.25688410171283,"old":-38.591580173705026,"activation":1.208823499546531e-18,"bias":3.299826859426889,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-935.30664382671,"old":-940.2808762851099,"activation":0,"bias":-0.5545890434772017,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":1.281761946707992,"old":-2.2060048974214634,"activation":0.7827495494707233,"bias":1.0913726215621826,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":5.65115686287978,"old":12.291835987859047,"activation":0.9964988512672452,"bias":-0.3506361876896138,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-19.779688111365587,"old":-18.22853192325963,"activation":2.5691567263272796e-9,"bias":0.4745724345373834,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":94.82432167019643,"old":88.75057456628292,"activation":1,"bias":-1.4833536215073453,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-10.069713725206569,"old":-15.809743724651678,"activation":0.000042340941025999234,"bias":0.47778836444182726,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-29.83798633883703,"old":-38.571048265733225,"activation":1.1003407120641258e-13,"bias":3.596735885579122,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":23.87483028377885,"old":24.79335430917492,"activation":0.9999999999572149,"bias":0.7308544193646698,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-8.974523435509022,"old":-7.481766795974442,"activation":0.0001265782300273194,"bias":0.17628090656399842,"layer":"0","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-663.8762233892807,"old":-664.0079404709991,"activation":4.810824513706611e-289,"bias":0.4383022667964556,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-148.9060725731861,"old":-149.55626948969257,"activation":2.1424680768530175e-65,"bias":-1.6958844788677496,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-1.3542355210398214,"old":-0.7793908891951506,"activation":0.2051787785614185,"bias":-1.026213400407888,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-19.568162703858267,"old":-20.187306232330908,"activation":3.1743507711687146e-9,"bias":-19.59263882993765,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":0.8793674132338325,"old":0.5593423876971615,"activation":0.7066911164252356,"bias":0.21927867954735647,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-4.664755064149356,"old":-1.9889052981170023,"activation":0.00933361841266747,"bias":-0.8556062746455415,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-1.9164752234595857,"old":-1.8281185527565262,"activation":0.1282551405224092,"bias":0.23835757169115035,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-4.466619586520133,"old":-5.224000526859311,"activation":0.011355646153087222,"bias":-0.1281379304945125,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":8.853330465115349,"old":9.133248406365988,"activation":0.9998571154162035,"bias":1.393546185059949,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":23.43006516183619,"old":23.253364200298616,"activation":0.9999999999332498,"bias":1.2240500436564536,"layer":"1","squash":"LOGISTIC"},{"trace":{"elegibility":{},"extended":{}},"state":-8.289654248788754,"old":-11.479536251126873,"activation":0.00025103823028598606,"bias":0.3678977207598242,"layer":"output","squash":"LOGISTIC"}],"connections":[{"from":"0","to":"3","weight":0.429887730323839,"gater":null},{"from":"0","to":"4","weight":-0.8022955578064366,"gater":null},{"from":"0","to":"5","weight":-0.5625430393757185,"gater":null},{"from":"0","to":"6","weight":1.0710772782224622,"gater":null},{"from":"0","to":"7","weight":0.25018648195257304,"gater":null},{"from":"0","to":"8","weight":-0.9796366296634696,"gater":null},{"from":"0","to":"9","weight":-0.9258112902330818,"gater":null},{"from":"0","to":"10","weight":-1.4085583753058373,"gater":null},{"from":"0","to":"11","weight":0.14814903635420518,"gater":null},{"from":"0","to":"12","weight":0.2407671999249322,"gater":null},{"from":"1","to":"3","weight":-1.014902212830103,"gater":null},{"from":"1","to":"4","weight":-0.9073546781890016,"gater":null},{"from":"1","to":"5","weight":-0.3943926442491512,"gater":null},{"from":"1","to":"6","weight":-1.9028611514078975,"gater":null},{"from":"1","to":"7","weight":0.2228300510420626,"gater":null},{"from":"1","to":"8","weight":-48.873467837670105,"gater":null},{"from":"1","to":"9","weight":-0.6360296825661543,"gater":null},{"from":"1","to":"10","weight":1.6342976250684744,"gater":null},{"from":"1","to":"11","weight":0.13370265874602466,"gater":null},{"from":"1","to":"12","weight":-0.3974364614411773,"gater":null},{"from":"2","to":"3","weight":-1.4883332464343741,"gater":null},{"from":"2","to":"4","weight":-29.96770435277074,"gater":null},{"from":"2","to":"5","weight":0.12846909442659027,"gater":null},{"from":"2","to":"6","weight":0.04630153037140716,"gater":null},{"from":"2","to":"7","weight":-0.7092973209012442,"gater":null},{"from":"2","to":"8","weight":4.874133818469072,"gater":null},{"from":"2","to":"9","weight":-0.13934103916369128,"gater":null},{"from":"2","to":"10","weight":-0.8568170084721733,"gater":null},{"from":"2","to":"11","weight":0.713401710518992,"gater":null},{"from":"2","to":"12","weight":-0.3292774763928527,"gater":null},{"from":"3","to":"13","weight":0.06841240773865498,"gater":null},{"from":"3","to":"14","weight":-1.1378956427964737,"gater":null},{"from":"3","to":"15","weight":-0.670593509713966,"gater":null},{"from":"3","to":"16","weight":0.18180469839916838,"gater":null},{"from":"3","to":"17","weight":0.6609113875202197,"gater":null},{"from":"3","to":"18","weight":2.095810618832426,"gater":null},{"from":"3","to":"19","weight":0.5713836588987871,"gater":null},{"from":"3","to":"20","weight":1.0275585356273202,"gater":null},{"from":"3","to":"21","weight":-0.027275989525748973,"gater":null},{"from":"3","to":"22","weight":0.645938567656223,"gater":null},{"from":"4","to":"13","weight":0.5927922043141796,"gater":null},{"from":"4","to":"14","weight":-1.37628534399455,"gater":null},{"from":"4","to":"15","weight":0.8507004076100246,"gater":null},{"from":"4","to":"16","weight":0.0117764402663868,"gater":null},{"from":"4","to":"17","weight":-0.14270823440230718,"gater":null},{"from":"4","to":"18","weight":-0.013824752028635257,"gater":null},{"from":"4","to":"19","weight":-0.8046762492119046,"gater":null},{"from":"4","to":"20","weight":0.23097073209468805,"gater":null},{"from":"4","to":"21","weight":1.3065013761043485,"gater":null},{"from":"4","to":"22","weight":0.010181011712280641,"gater":null},{"from":"5","to":"13","weight":0.1901687663829228,"gater":null},{"from":"5","to":"14","weight":0.2469076899067567,"gater":null},{"from":"5","to":"15","weight":-0.8433524402324984,"gater":null},{"from":"5","to":"16","weight":0.9041592374207938,"gater":null},{"from":"5","to":"17","weight":0.4722587808807872,"gater":null},{"from":"5","to":"18","weight":-3.915595941754139,"gater":null},{"from":"5","to":"19","weight":-0.13071241495156197,"gater":null},{"from":"5","to":"20","weight":1.106634333402818,"gater":null},{"from":"5","to":"21","weight":-0.3897331733098682,"gater":null},{"from":"5","to":"22","weight":0.25728025338341465,"gater":null},{"from":"6","to":"13","weight":-0.5339443340183405,"gater":null},{"from":"6","to":"14","weight":-148.1855447721461,"gater":null},{"from":"6","to":"15","weight":-0.3938355666134712,"gater":null},{"from":"6","to":"16","weight":-0.42923410575155274,"gater":null},{"from":"6","to":"17","weight":0.7164073868297254,"gater":null},{"from":"6","to":"18","weight":-0.13005448065302105,"gater":null},{"from":"6","to":"19","weight":-0.31990982071773993,"gater":null},{"from":"6","to":"20","weight":-0.22085659560513893,"gater":null},{"from":"6","to":"21","weight":3.735501142621418,"gater":null},{"from":"6","to":"22","weight":-0.6732877821284045,"gater":null},{"from":"7","to":"13","weight":0.510725872548712,"gater":null},{"from":"7","to":"14","weight":0.4378458014322274,"gater":null},{"from":"7","to":"15","weight":-10.093102489882163,"gater":null},{"from":"7","to":"16","weight":25012.39615719164,"gater":null},{"from":"7","to":"17","weight":1.2459706226133584,"gater":null},{"from":"7","to":"18","weight":-3.0711602173513923,"gater":null},{"from":"7","to":"19","weight":-0.13928084727120177,"gater":null},{"from":"7","to":"20","weight":0.4607628788229091,"gater":null},{"from":"7","to":"21","weight":0.3028921013907355,"gater":null},{"from":"7","to":"22","weight":0.9564079218828727,"gater":null},{"from":"8","to":"13","weight":-663.9978127888974,"gater":null},{"from":"8","to":"14","weight":-0.07752522782897683,"gater":null},{"from":"8","to":"15","weight":0.022858967284210774,"gater":null},{"from":"8","to":"16","weight":0.5019070062404709,"gater":null},{"from":"8","to":"17","weight":-0.27723734780797515,"gater":null},{"from":"8","to":"18","weight":-1.236797006615169,"gater":null},{"from":"8","to":"19","weight":-1.974167088887865,"gater":null},{"from":"8","to":"20","weight":0.24208887457347256,"gater":null},{"from":"8","to":"21","weight":2.5005799306044474,"gater":null},{"from":"8","to":"22","weight":0.5088954209276592,"gater":null},{"from":"9","to":"13","weight":-0.746198482380629,"gater":null},{"from":"9","to":"14","weight":0.3972573959816465,"gater":null},{"from":"9","to":"15","weight":5.2516885278517655,"gater":null},{"from":"9","to":"16","weight":0.3361069915910056,"gater":null},{"from":"9","to":"17","weight":0.015879450367734083,"gater":null},{"from":"9","to":"18","weight":0.4678657847394887,"gater":null},{"from":"9","to":"19","weight":1.3014194867297368,"gater":null},{"from":"9","to":"20","weight":-0.9309175447803113,"gater":null},{"from":"9","to":"21","weight":-7.5314697173267735,"gater":null},{"from":"9","to":"22","weight":-25.555828386569758,"gater":null},{"from":"10","to":"13","weight":0.4069411504170928,"gater":null},{"from":"10","to":"14","weight":-1.005714248092152,"gater":null},{"from":"10","to":"15","weight":0.4836095566244936,"gater":null},{"from":"10","to":"16","weight":-13.956012702044756,"gater":null},{"from":"10","to":"17","weight":1.1861454154663935,"gater":null},{"from":"10","to":"18","weight":0.010424934770037586,"gater":null},{"from":"10","to":"19","weight":0.5438886595606658,"gater":null},{"from":"10","to":"20","weight":-2.823062861141583,"gater":null},{"from":"10","to":"21","weight":-0.10098367311458978,"gater":null},{"from":"10","to":"22","weight":-0.8621426027198221,"gater":null},{"from":"11","to":"13","weight":0.06650844215005863,"gater":null},{"from":"11","to":"14","weight":0.33012417135206396,"gater":null},{"from":"11","to":"15","weight":0.7014925664713906,"gater":null},{"from":"11","to":"16","weight":-0.7575544207628382,"gater":null},{"from":"11","to":"17","weight":-0.1463144377880521,"gater":null},{"from":"11","to":"18","weight":0.6221963545700586,"gater":null},{"from":"11","to":"19","weight":0.2403308414490686,"gater":null},{"from":"11","to":"20","weight":-5.226600764115108,"gater":null},{"from":"11","to":"21","weight":1.542123025119495,"gater":null},{"from":"11","to":"22","weight":22.16762000827407,"gater":null},{"from":"12","to":"13","weight":0.2424065109087108,"gater":null},{"from":"12","to":"14","weight":84.17243322798913,"gater":null},{"from":"12","to":"15","weight":-0.043905697878534766,"gater":null},{"from":"12","to":"16","weight":0.36425129303821663,"gater":null},{"from":"12","to":"17","weight":0.6348464574859232,"gater":null},{"from":"12","to":"18","weight":-0.29894184051053935,"gater":null},{"from":"12","to":"19","weight":0.42031001912258825,"gater":null},{"from":"12","to":"20","weight":-0.5098353070993482,"gater":null},{"from":"12","to":"21","weight":0.3245536517000992,"gater":null},{"from":"12","to":"22","weight":0.9973621181773292,"gater":null},{"from":"13","to":"23","weight":-5814.803499751474,"gater":null},{"from":"14","to":"23","weight":0.42310661466795163,"gater":null},{"from":"15","to":"23","weight":-27.127753404165265,"gater":null},{"from":"16","to":"23","weight":836.6373720614065,"gater":null},{"from":"17","to":"23","weight":-0.9692813648684455,"gater":null},{"from":"18","to":"23","weight":-2.735045775698224,"gater":null},{"from":"19","to":"23","weight":-0.9356994178190121,"gater":null},{"from":"20","to":"23","weight":-3.2589390643189446,"gater":null},{"from":"21","to":"23","weight":-2.751356376500378,"gater":null},{"from":"22","to":"23","weight":0.5269739560263449,"gater":null}]}';
  }
  var goodNetwork = Network.fromJSON($.parseJSON(goodNetworkString));
  goodNetwork.optimize();
  currentGeneration[id][1] = goodNetwork;
  console.log("The network was imported for genome " + (id+1));
}
function outputNetwork() {
  var id = prompt("Insert genome number");
  var networkString = JSON.stringify(currentGeneration[id-1][1].toJSON())
  console.log("line");
  console.log(networkString);
  console.log("line");
}
