var server = require('http').createServer(handler)
  , fs = require('fs')
  , io = require('socket.io').listen(server);

server.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

// Reduce the level of logging
io.set('log level', 1); 
// Upon a new connection
io.sockets.on('connection', function (socket) {
  // Tell the client we're ready
  socket.emit("ready");

  // Upon receiving new messages
  socket.on('msg', function (data) {
    // Broadcast to every client (except this one)
    socket.broadcast.emit('message', "He just said " + data);
    // Emit back to client
    socket.emit('message', "I just said " + data);
  });

  // Upon setting a nickname
  socket.on('setNickname', function(name){
     // Set the nickname
     socket.set('nickname', name, function () {
      // Broadcast it to all clients (except this one)
      socket.broadcast.emit('message', name + " has just joined.");
      // Inform the client we've set the nickname
      socket.emit("nicknameSet");
    });
  });
 
  socket.on('disconnect', function() {
    socket.emit("message", "disconnected");
  });
});
