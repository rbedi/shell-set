#!/bin/env node

// Load the TCP Library
net = require('net');
 
// Keep track of the chat clients
var clients = [];

// Generate a SET deck

var colors = 'wxy';
//iov
var numbers = '123';
var shapes = 'O~V';
var fill = 'Q@-';
var deck = [];

for (var i = 0; i < 3; i++){
  for (var j = 0; j < 3; j++){
    for (var k = 0; k < 3; k++){
      for (var l = 0; l < 3; l++){
        var card = colors[i]+numbers[j]+shapes[k]+fill[l];
        deck.push(card);
      }
    }
  }
}
var cardsout = [];

//shapes[0] = squigglies (^ triangles)
//shapes[1] = ovals
//shapes[2] = triangles (v)
//shapes[i][0] = empty
//shapes[i][1] = half-filled
//shapes[i][2] = fully-filled

var shapes = [
      [   
          ["    XXX    ","  XX   XX  "," X       X ","XXXXXXXXXXX"],
          ["    XXX    ","  XX X XX  "," X X X X X ","XXXXXXXXXXX"],
          ["    XXX    ","  XXXXXXX  "," XXXXXXXXX ","XXXXXXXXXXX"]
      ],       
      [
          [" XXXXXXXXX ","X         X","X         X"," XXXXXXXXX "],
          [" XXXXXXXXX ","X X X X X X","X X X X X X"," XXXXXXXXX "],
          [" XXXXXXXXX ","XXXXXXXXXXX","XXXXXXXXXXX"," XXXXXXXXX "]
      ],
      [
          ["XXXXXXXXXXX"," X       X ","  XX   XX  ","    XXX    "],
          ["XXXXXXXXXXX"," X X X X X ","  XX X XX  ","    XXX    "],
          ["XXXXXXXXXXX"," XXXXXXXXX ","  XXXXXXX  ","    XXX    "]
      ]
  ];



var seed = 47;
function random() {
    //var x = Math.sin(seed++) * 10000;
    //return x - Math.floor(x);
    return Math.random();
}


  function getCards(numCards){
    var toAdd = [];
    for (var i = 0; i < numCards; i++){
      var randCard = Math.floor((random()*deck.length));
      toAdd.push(deck[randCard]);
      deck.splice(randCard, 1);
    }
    return toAdd;
  }

  function replaceCards(positions){
    newCards = getCards(positions.length);
    for(var i = 0; i < positions.length; i++){
      cardsout[positions[i]] = newCards[i];
    }
  }

  
replaceCards([0,1,2,3,4,5,6,7,8,9,10,11]);


// Start a TCP Server
net.createServer(function (socket) {
  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort;
  socket.score = 0;

  // Put this new client in the list
  clients.push(socket);
 
  // Send a nice welcome message and announce
  socket.write("Welcome " + socket.name + "\n");
  broadcast(socket.name + " joined the chat\n", socket);
  
  //Send string representation of cards
  printDeck();
  //broadcast(deck.toString(), socket);
  
  // Handle incoming messages from clients.
  socket.on('data', function (data){
    broadcast(socket.name + "> " + data, socket);

    if(((data+"").trim()).substr(0,5)=='/nick'){
      var old = socket.name;
      socket.name = ((data+"").trim()).substr(6);
      broadcast(old + " is now known as " + socket.name + "\n", "host"); 
    }
    else if (((data+"").trim()).substr(0,5)=='/hint'){
      hint();
    }
    var find = '^[A-L]+$';
    var re = new RegExp(find,'g')
    input = ((data+"").trim()).toUpperCase();
    if(input.match(re) !== null){
        processGuess(((data+"").trim()).toUpperCase());
    }
  });
 

  // Remove the client from the list when it leaves
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    broadcast(socket.name + " left the chat.\n");
  });
  
  // Send a message to all clients
  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't want to send it to sender
      if (client === sender) return;
      client.write(message);
    });
    // Log it to the server output too
    process.stdout.write(message)
  }

function codeToAscii(code) {
    var shape;
    if (code[2] == '~') shape = 0;
    else if (code[2] == 'V') shape = 2;
    else shape = 1;
    var fills;
    if (code[3] == "Q") fills = 1;
    else if (code[3] == "-") fills = 0;
    else fills = 2;
    var shapearr = shapes[shape][fills];
    var shapearrColored = [];
    for (var i = 0; i < 4; i++) {
        var find = '[^ ]';
        var re = new RegExp(find, 'g');
        shapearrColored[i] = "\033[;" + (11 + ((code.charAt(0)).toUpperCase()).charCodeAt() - "A".charCodeAt()) + "m" + shapearr[i] +  "\033[0m";
    }
    var blank = ['           '];
    if (code[1] == "3") {
        return [].concat(shapearrColored,blank,shapearrColored,blank,shapearrColored);
    } else if (code[1] == "2") {
        return [].concat(blank,blank,shapearrColored,blank,blank,shapearrColored,blank,blank);
    } else {
        return [].concat(blank,blank,blank,blank,blank,shapearrColored,blank,blank,blank,blank,blank);
    }
}

function printDeck() {
    var lines = ["","","","","","","","","","","","","",""];
    var label = "";
    for (var i = 0; i < cardsout.length; i++) {
        label += "     " + String.fromCharCode(i+"A".charCodeAt()) + "              ";
        var card = codeToAscii(cardsout[i]);
        for (var j = 0; j < card.length; j++) {
            lines[j] += card[j];
            lines[j] += "         ";
        }
        if (i%4 == 3) {
            broadcast(label+"\n\n", "host");
            for (var k = 0; k < lines.length; k++) {
                broadcast(lines[k] + "\n", "host");
            }
            broadcast("\n");
            var lines = ["","","","","","","","","","","","","",""];
            var label = "";

        }
    }
}

  function getCards(numCards){
    var toAdd = [];
    for (var i = 0; i < numCards; i++){
      var randCard = Math.floor((random()*deck.length));
      toAdd.push(deck[randCard]);
      deck.splice(randCard, 1);
    }
    return toAdd;
  }

  function replaceCards(positions){
    newCards = getCards(positions.length);
    for(var i = 0; i < positions.length; i++){
      cardsout[positions[i]] = newCards[i];
    }
  }

  function printcards() {
    var line = "";
    var label = "";
    for (var i = 0; i < cardsout.length; i++) {
      line += cardsout[i] + "    ";
      label += "  " + String.fromCharCode(i+"A".charCodeAt()) + "     ";
      if (i % 3 == 2) {
        broadcast(line+"\n", "host");
        broadcast(label+"\n", "host");
        line = "";
        label = "";
      }
    }
  }
  
  function valid(s){
  return (s[0] != s[1] && s[1] != s[2] && s[0] != s[2]) || (s[0] == s[1] && s[1] == s[2]);
}

  function validateSet(guesses){
  for (var i = 0; i < 4; i++) {
    if (!valid(guesses[0][i]+guesses[1][i]+guesses[2][i])) return false;
  }
  return true;
  }

  function findSet(){
    for(var i = 0; i < cardsout.length; i++){
      for (var j = 0; j < cardsout.length; j++){
        if(cardsout.indexOf(findThirdCard([cardsout[i],cardsout[j]])) > -1){
          var set = [String.fromCharCode(i+"A".charCodeAt()),String.fromCharCode(j+"A".charCodeAt())];
          set.push(String.fromCharCode((cardsout.indexOf(findThirdCard([cardsout[i],cardsout[j]])))+"A".charCodeAt()));
          if(!hasDuplicate(set)) return set;
        }
      }
    }
  }

  function findThirdCard(cards){
    var properties = ["wxy","123","O~V","-Q@"];
    for (var i = 0; i < 4; i++) {
      if (cards[0][i]==cards[1][i]){
        properties[i] = cards[0][i];
      }
      else{
        for (var j = 0; j < 2; j++){
          toReplace = cards[j][i];
          var re = new RegExp(toReplace,"g");
          properties[i] = properties[i].replace(re, "");          
        }
      }
    }
    return properties.join("");
  }

  function validateSuperSet(guesses){
    var thirds = [];
    for (var i = 1; i < 4; i++) {
        var possible = [1,2,3];
        possible.splice(i-1, 1);
        if (findThirdCard([guesses[0], guesses[i]]) ==
            findThirdCard([guesses[possible[0]], guesses[possible[1]]])){
            return true;
        }
    }
    return false;
  }

function hasDuplicate(arr) {
    var i = arr.length, j, val;
    while (i--) {
      val = arr[i];
      j = i;
      while (j--) {
        if (arr[j] === val) {
          return true;
        }
      }
    }
    return false;
}

function hint(){
  if(findSet() === undefined){
    addThreeCards();
  }
  else{
    set = findSet();
    broadcast("HINT: SET includes card " + set[0] + "\n", "host");
  }
}

function endGame(){
    broadcast("Out of cards, thanks for playing!", "host");
    process.exit();
}

  function processGuess(guess) {
    
    if(guess.length==4){
    guess = guess.toUpperCase();
    var guesses = [];
    var guessesLocations  = [];
    for (var i = 0; i < 4; i++) {
      guesses.push(cardsout[guess.charAt(i).charCodeAt() - "A".charCodeAt()]);
      guessesLocations.push(guess.charAt(i).charCodeAt() - "A".charCodeAt());
    }
    if(validateSuperSet(guesses) && !hasDuplicate(guesses)){
      broadcast(socket.name + " found a SUPER SET!\n","host");
      socket.score += 3;
      broadcast(socket.name + "'s new score is: " + socket.score + "\n", "host");
      if(deck.length<4) endGame();
      replaceCards(guessesLocations);
      printDeck();
    }
    else{
      socket.score -= 0.25;
      broadcast("Not a super set...\n",socket.name);
      broadcast(socket.name + "'s new score is: " + socket.score + "\n", "host");
    }
    }
    
    if(guess.length==3){
      var guesses = [];
      guess = guess.toUpperCase();
      var guessesLocations  = [];
      for (var i = 0; i < 3; i++) {
        guesses.push(cardsout[guess.charAt(i).charCodeAt() - "A".charCodeAt()]);
        guessesLocations.push(guess.charAt(i).charCodeAt() - "A".charCodeAt());
      }
      if(validateSet(guesses) && !hasDuplicate(guesses)){
          broadcast(socket.name + " found a SET!!!!\n", "host");
          socket.score += 1;
          broadcast(socket.name + "'s new score is: " + socket.score + "\n"); 
          if(deck.length<3) endGame();
          replaceCards(guessesLocations);
          printDeck(); 
        } 
        else{
          socket.score -= 0.25;
          broadcast ("Not a set...\n",socket.name);
          broadcast(socket.name + "'s new score is: " + socket.score + "\n", "host");
          /*if(findSet() !== undefined){
              broadcast ("But here's a set: " + findSet().toString() + "\n", "host");
          }*/
        }
    }

}
}).listen(5000);
 
// Put a friendly message on the terminal of the server.
console.log("Chat server running at port 5000\n");