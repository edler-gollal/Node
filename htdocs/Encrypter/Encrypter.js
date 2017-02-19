function randomSymbol() {
  var symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  return symbols.charAt(parseInt(Math.random() * symbols.length));
}

function encrypt() {
  var key = $('#key').val();
  var content = $('#content').val();

  var output = CryptoJS.AES.encrypt(content, key).toString();

  $('#content').val("");
  $('#contentoutput').val(output);
}

function decrypt() {
  var key = $('#key').val();
  var content = $('#contentoutput').val();

  var output = CryptoJS.AES.decrypt(content, key).toString(CryptoJS.enc.Utf8);

  $('#contentoutput').val("");
  $('#content').val(output);
}
