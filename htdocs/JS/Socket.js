
$(document).ready(function(){

  if(prompt("Passwort?") != "cool") return; //I know you "hacked" my password here

  var socket = io();

  $('form').submit(function(){
    var msg = $('#m').val()
    if(msg != "") {
      socket.emit('chat message', msg, name);
      $('#m').val('');
    }
    return false;
  });

  socket.on('chat message', function(msg) {
    $('#messages').append('<li>' + msg + '</li>');
  });

  socket.on('info message', function(msg) {
    $('#messages').append('<li class="information">' + msg + '</li>');
  });

  socket.on('name change', function(changeTo) {
    changeName(changeTo);
  })

  socket.on('pingcheck', function(milliseconds) {
    socket.emit('pingcheck', milliseconds);
  })

  function changeName(changeTo) {
    socket.emit('name change', name, changeTo);
    name = changeTo;
  }

});

// <script>
// setInterval(function() {
//   $('li').each(function(){
//     console.log("test");
//     var r = parseInt(Math.random() * 255);
//     var g = parseInt(Math.random() * 255);
//     var b = parseInt(Math.random() * 255);
//     $( this ).css("color","rgb(" + r + "," + g + "," + b + ")");
//   })
// }, 10);</script>
