#!/bin/env node

// Load the TCP Library
net = require('net');

// Keep track of the chat clients
var clients = [];

var colors = 'WXY';
var fill = '@=:';
var deck = [];
var cardsout = [];

var SET_PTS = 1;
var SUPERSET_PTS = 3;

for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) for (var l = 0; l < 3; l++)
  deck.push([i,j,k,l]);

var shapes = [
["XXX  "," XXXX"," XXX ","XXX  ","XXXX ","  XXX"], // Squiggly
  [" XXX ","XXXXX","XXXXX","XXXXX","XXXXX"," XXX "], // Oval
  ["  X  "," XXX ","XXXXX","XXXXX"," XXX ","  X  "]  // Diamond
  ];

//var seed = 47; // seed for debugging
function random() {
  //var x = Math.sin(seed++) * 10000; // lol -syd
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
  for(var i = 0; i < positions.length; i++)
    cardsout[positions[i]] = newCards[i];
}

function toInt(letter) { return letter.charCodeAt() - "A".charCodeAt(); }

function toLetter(i) { return String.fromCharCode(i + "A".charCodeAt()); }

function isOut(card) {
  for (var i = 0; i < cardsout.length; i++)
    if (card.join("") == cardsout[i].join("")) return true;
  return false;
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
    line += (cardsout[i].join("")) + "    ";
    label += "  " + toLetter(i) + "     ";
    if (i % 3 == 2) {
      broadcast(line+"\n", "host");
      broadcast(label+"\n", "host");
      line = "";
      label = "";
    }
  }
}

function validateSet(guesses){
  for (var i = 0; i < guesses[0].length; i++) {
    if ((guesses[0][i]+guesses[1][i]+guesses[2][i]) % 3 != 0) return false;
  }
  return true;
}

function findSet(){
  for(var i = 0; i < cardsout.length; i++){
    for (var j = 0; j < cardsout.length; j++){
      if (i == j) continue;
      if(isOut(findThirdCard(cardsout[i],cardsout[j]))){
        var set = [toLetter(i),toLetter(j)];
        set.push(findThirdCard(cardsout[i],cardsout[j]));
        return set;
      }
    }
  }
}

function findThirdCard(card1, card2){
  var card = [0,0,0,0];
  for (var i = 0; i < card.length; i++) {
    if (card1[i]==card2[i])
      card[i] = card1[i];
    else
      card[i] = 3 - (card1[i] + card2[i]);
  }
  return card;
}
function validateSuperSet(guesses){
  var thirds = [];
  for (var i = 1; i < 4; i++) {
    var possible = [1,2,3];
    possible.splice(i-1, 1);
    if (findThirdCard(guesses[0], guesses[i]).join("") ==
        findThirdCard(guesses[possible[0]], guesses[possible[1]]).join("")){
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
      if (arr[j] === val)
        return true;
    }
  }
  return false;
}

// converts card code to its ascii representation
function codeToAscii(code) {
  var shape = code[2];
  var fills = fill[code[3]];
  var shapearr = shapes[shape];
  var shapearrColor = [];
  for (var i = 0; i < shapearr.length; i++) {
    var find = 'X';
    var re = new RegExp(find, 'g');
    shapearrColor[i] = shapearr[i].replace(re, fills);
    shapearrColor[i] = "\033[;" + (11 + toInt(colors.charAt(code[0]))) + "m" + shapearrColor[i] +  "\033[0m";
    if (code[1] == 2) {
      shapearrColor[i] = shapearrColor[i] + " " + shapearrColor[i] + " " + shapearrColor[i];
    } else if (code[1] == 1) {
      shapearrColor[i] = "   " + shapearrColor[i] + " " + shapearrColor[i] + "   ";
    } else {
      shapearrColor[i] = "      " + shapearrColor[i] + "      ";
    }
  }
  return shapearrColor;
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
      var re = new RegExp(find,'g');
      input = ((data+"").trim()).toUpperCase();
      if(input.match(re) !== null){
        processGuess(((data+"").trim()));
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

    // prints all cards out on table
    function printDeck() {
      var lines = ["","","","","",""];
      var label = "";
      for (var i = 0; i < cardsout.length; i++) {
        label += "     " + toLetter(i) + "              ";
        var card = codeToAscii(cardsout[i]);
        for (var j = 0; j < card.length; j++) {
          lines[j] += card[j];
          lines[j] += "    ";
        }
        if (i%3 == 2) {
          broadcast(label+"\n\n", "host");
          for (var k = 0; k < lines.length; k++) {
            broadcast(lines[k] + "\n", "host");
          }
          broadcast("\n");
          var lines = ["","","","","",""];
          var label = "";
        }
      }
    }

    function hint(){
      var set = findSet();
      if(set === undefined)
        broadcast("No sets on board! look for a superset.\n", "host");
      else
        broadcast("HINT: SET includes card " + set[0] + "\n", "host");
    }

    function endGame(){
      broadcast("GAME OVER: OUT OF CARDS", "host");
      broadcast("SCORES:\n", "host");
      var winner = clients[0];
      for (var i = 0; i < clients.length; i++) {
        broadcast("\t" + client[i].name + ":\t" + client[i].score + "\n");
        if (client[i].score > winner.score) winner = client[i];
      }
      broadcast(winner.name + " wins!\nThanks for playing!\n\n");
      process.exit();
    }

    function processGuess(guess) {
      guess = guess.toUpperCase();
      if (guess.length < 3 || guess.length > 4) return;
      var guesses = [];
      var guessesLocations  = [];
      for (var i = 0; i < guess.length; i++) {
        guessesLocations.push(toInt(guess.charAt(i)));
        guesses.push(cardsout[guessesLocations[i]]);
      }

      var type = (guess.length == 3 ? "set" : "superset");
      if (!hasDuplicate(guesses) && ( (guess.length == 4 && validateSuperSet(guesses)) ||
            (guess.length == 3 && validateSet(guesses)) ) ) {
        broadcast(socket.name + " found a " + type + "!!\n","host");
        socket.score += (type == "set" ? SET_PTS : SUPERSET_PTS);
        if (deck.length < guess.length) endGame();
        replaceCards(guessesLocations);
        printDeck();
      } else {
        socket.score -= 0.5;
        broadcast("Not a " + type + "...\n", "host");
      }
      broadcast(socket.name + "'s new score is: " + socket.score + "\n", "host");
    }
}).listen(5000);

// Put a friendly message on the terminal of the server.
console.log("Chat server running at port 5000\n");
