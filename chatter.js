var fs = require('fs');

exports = module.exports = function(io) {

  var clientAmount = 0;

  io.on('connection', function(socket){

    clientAmount++;
    socket.name = "Anonymous";
    sendInfoMessage(socket.name + " connected");

    io.to(socket.id).emit('request name');

    var chatlog;
    var buf = new Buffer(4096);
    fs.open(__dirname + '/tmp/chatlog.txt', 'a+', function(err,fd) {
      if(err) console.log(err);
      fs.read(fd,buf,0,buf.length,0,function(err,bytes){
        if(err) console.log(err);
        if(bytes > 0){
          chatlog = buf.slice(0, bytes).toString();
          var lines = chatlog.split("\n");
          lines.slice(Math.max(lines.length-5,0));
          for(var i = 0; i < lines.length; i++) {
            if(lines[i].charAt(0) == "%") {
              io.to(socket.id).emit('info message', lines[i].substr(1));
            } else {
              io.to(socket.id).emit('chat message', lines[i]);
            }
          }
        }
      })
    })

    socket.on('chat message', function(msg) {
      sendChatMessage(socket,msg);
    });

    socket.on('name change', function(oldname, newname) {
      socket.name = newname;
      if(newname != "Anonymous") {
        sendInfoMessage(oldname + " is now called " + newname);
      }
    })

    socket.on('pingcheck', function(milliseconds){
      var d = new Date();
      var diff = d.getMilliseconds() - milliseconds;
      io.to(socket.id).emit('info message', "Your ping is " + diff + "ms!");
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
      io.to(socket.id).emit('name change', args[0]);
    } else if(cmd == "hack") {
      sendChatMessage(socket,line,true);
    } else if(cmd == "users") {
      sendInfoMessage("There are " + clientAmount + " online users.");
    } else if(cmd == "tts") {
      line = "<script> var msg = new SpeechSynthesisUtterance('" + socket.name + " said " + line + "'); window.speechSynthesis.speak(msg)</script>";
      sendChatMessage(socket,line,true);
    } else if(cmd == "ping") {
      var d = new Date();
      io.to(socket.id).emit('pingcheck', d.getMilliseconds());
    }
  }

  function sendChatMessage (socket,msg,enableTags){
    if(msg.charAt(0) == "/"){
      msg = msg.substr(1);
      runCommand(socket,msg);
    } else {
      var line;
      var d = new Date();
      var hours = d.getHours();
      if(hours < 10) hours = "0" + hours;
      var minutes = d.getMinutes();
      if(minutes < 10) minutes = "0" + minutes;
      var time = hours + ":" + minutes;
      line = time + " - " + socket.name + " > ";

      if(!enableTags) {
        msg = msg.replace(/</g, "&lt;");
        msg = msg.replace(/>/g, "&gt;");

        var words = msg.split(" ");
        msg = "";
        words.forEach(function(element, index) {
          if(element.includes(".")) {
            if(!((element.charAt(0) == ".")||(element.charAt(element.length-1) == "."))){
              if(!(element.substring(0,8).includes("://"))){
                element = "<a target='_blank' href='http://" + element + "'>" + element + "</a>";
              } else {
                element = "<a target='_blank' href='" + element + "'>" + element + "</a>";
              }
            }
          }
          msg += element + " ";
        })
      }

      line += msg;
      io.emit('chat message', line);
      fs.appendFile(__dirname + '/tmp/chatlog.txt', line + "\n", function(err){
        if(err) console.log(err);
      })

    }
  }
  function sendInfoMessage(msg) {
    io.emit('info message', msg);
    if(!(msg.includes("connect"))){
      fs.appendFile(__dirname + '/tmp/chatlog.txt', '%' + msg + "\n", function(err){
        if(err) console.log(err);
      })
    }
  }

}
