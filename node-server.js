var server = require('http').createServer(handler)
  , fs = require('fs')
  , io = require('socket.io').listen(server);
  
server.listen(process.env.PORT || 8080);

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

var chatHistory = [];

// Upon a new connection
io.sockets.on('connection', function (socket) {
  // Tell the client we're ready
  socket.emit("ready");
  
  // Upon the client setting a nickname (joining chat room)
  socket.on('joinChat', function(name){
      // Set the nickname
      socket.set('nickname', name, function () {
        // Broadcast it to all clients (except this one)
        socket.broadcast.emit('newVisitor', name);

        // Inform the client we've set the nickname and they've joined
        socket.emit("joined");
        
        // Send the client the chat history
        socket.emit("history", chatHistory);
    });
  });

  // Upon receiving new messages
  socket.on('msg', function (message) {
    var nickname = "";
    // Retrieve the nickname
    socket.get('nickname', function(err, name){
        nickname = name;
    });

    // Add new messages to chat history
    if (chatHistory.length >= 10) {
      chatHistory.splice(0,1);
    } 
    chatHistory.push({"nickname": nickname, "message": message});

    // Broadcast to every client (except this one)
    socket.broadcast.emit('message', nickname, message);
    // Emit back to client
    socket.emit('message', "You", message);
  });

 
 // Upon disconnecting
  socket.on('disconnect', function() {
    socket.emit("message", "disconnected");
  });
});
