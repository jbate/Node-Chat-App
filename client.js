// Bind event listeners
var nicknameForm = document.getElementById("setNicknameForm");
addEventListener(nicknameForm, 'submit', setNickname);

var chatForm = document.getElementById("chatForm");
addEventListener(chatForm, 'submit', sendChat);


// Open a new connection with the server
var socket = io.connect();
var joined = false;
var nickname = "";

// When the connection is ready, show the setNickname form
socket.on('ready', function () {
    console.log("server ready");
    if(nicknameForm) {
  	   nicknameForm.style.display = "block";
    }
});

// On receiving new messages
socket.on('message', function (name, message) {
    if(joined){
        // Add it to the DOM
        addMessageToPage(formatMessage(name, message));

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(typingTimeoutFunction, 0);
    }
});

// On a new visitor joining
socket.on('newVisitor', function (name) {
    // Add it to the DOM
    addMessageToPage("<em>" + name + " has just joined</em>");
});

// Listen for any chat history the user has missed
socket.on("history", function(chatHistory){
  if(chatHistory.length > 0){
    addMessageToPage("&nbsp;&nbsp;<strong>Here's what you missed:</strong>");
    for(var i = 0; i < chatHistory.length; i++){
        // Add messages to the DOM
        addMessageToPage("&nbsp;&nbsp;" + formatMessage(chatHistory[i].nickname, chatHistory[i].message));
    }
  }
});

// Someone else is typing something... 
socket.on("isTyping", function(name, isTyping) {
  if (isTyping) {
      // If the "is typing" message doesn't exist
      if(!document.getElementById(name + "-typing")){
          // Create the new message
          var span = document.createElement('span');
          span.innerHTML = name + " is typing... ";
          span.setAttribute("id", name + "-typing");
          document.body.appendChild(span);
      }
      typingTimeout = setTimeout(typingTimeoutFunction, 2000);
  } else {
      // remove typing notification
      var span = document.getElementById(name + "-typing");
      if (span) {
          span.parentNode.removeChild(span);
      }
  }
});


// Set the nickname on the server
function setNickname(event){
	nickname = document.forms[0].nickname.value;
  if(nickname){
      // Join the chat room and provide our name
      socket.emit("joinChat", nickname);

    	// When it has been set and we've joined, the server will tell us,
    	// Then hide the nickname form and show the chat box.
    	socket.on("joined", function(){
          joined = true;
      		nicknameForm.parentNode.removeChild(nicknameForm);

      		// Show the chat dialog box
      		document.getElementById("chatForm").style.display = "block";
          // Add it to the DOM
          addMessageToPage("<em>You have now joined the chat</em>");
    	});
  }
  event.preventDefault();
}

// Send a new message to the server
function sendChat(event){
	socket.emit("msg", document.forms[0].text.value);
	// Reset value
	document.forms[0].text.value = "";
  event.preventDefault();
}

function formatMessage(name, message){
    // Highlight the user's name
    var highlight = "#3c763d;";
    if(name === "You"){
        highlight = "#999;";
    }
    return "<strong style='color:" + highlight + "'>" + name + "</strong>: " + message;
}

//"is typing" message
var typing = false,
   typingTimeout = undefined;

function typingTimeoutFunction() {
  typing = false;
  socket.emit("typing", nickname, false);
}

// Check if we are typing a new message and tell everyone
addEventListener(chatForm.getElementsByTagName("input")[0], 'keypress', function(event){
  if (event.which !== 13) {
      if (typing === false) {
          typing = true;
          // Tell the server we're typing
          socket.emit("typing", nickname, typing);
      } else {
          clearTimeout(typingTimeout);
          typingTimeout = setTimeout(typingTimeoutFunction, 2000);
      }
  }
});

// Add a new element to the DOM
function addMessageToPage (content) {
  // create a new div element
  // and give it some content
  var newDiv = document.createElement('div');
  newDiv.innerHTML = content;

  // add the newly created element and its content into the DOM
  document.body.appendChild(newDiv);
}

// Create an event listener and handle IE
function addEventListener(element, event, callback){
    if (element.addEventListener) {
        element.addEventListener(event, callback, false);  
    } else if (element.attachEvent)  {
        element.attachEvent('on' + event, callback);
    }
}