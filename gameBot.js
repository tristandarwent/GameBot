var Discord = require("discord.js");
var fs = require("fs");

var gameBot = new Discord.Client();

console.log("Running GameBot");

// Array of game objects
var games = [
	{name: "Carcassonne", maxPlayers: 5, nickNames: ["carc", "carcassonne"]},
	{name: "Lost Cities", maxPlayers: 2, nickNames: ["cuties", "lost cities", "lost cuties"]},
	{name: "Twilight Struggle", maxPlayers: 2, nickNames: ["twilight struggle", "twilight snuggle", "snuggle", "ts"]},
	{name: "Agricola", maxPlayers: 5, nickNames: ["gric", "agricola"]},
	{name: "Ascension", maxPlayers: 4, nickNames: ["ascension"]},
	{name: "Le Havre", maxPlayers: 5, nickNames: ["le havre"]},
	{name: "Patchwork", maxPlayers: 2, nickNames: ["patchwork", "patches"]},
	{name: "Lords of Waterdeep", maxPlayers: 6, nickNames: ["lords of waterdeep", "waterdeep", "low", "lords"]},
	{name: "Ticket To Ride", maxPlayers: 5, nickNames: ["ticket to ride", "ttr", "trains"]},
	{name: "Tanto Cuore", maxPlayers: 4, nickNames: ["tanto cuore", "tanto", "cuore", "anime maids", "waifus"]}
];

var sessions = [];

fs.readFile(__dirname + "/sessions.txt", 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  } else {
  	sessions = JSON.parse(data);
  }
  console.log(data);
});


// Runs on every message posted in discord
gameBot.on("message", function(message) {

	var channel = message.channel;

	// Converts message content to lowercase
	var input = message.content.toLowerCase();

	// Removes all unecessary spaces (double/triple spaces, leading, trailing, etc.)
	input = input.replace(/\s{2,}/g, ' ');

	// Breaks input into seperate words
	var inputWords = input.split(" ");

	// If first word is !interest keyword
	if (inputWords[0] === "!interest") {

		// Removes !interest keyword from input array
		inputWords.shift();

		var interestCommand = "";
		var interestModifier = "";

		/** Check for modifiers and remove them from input array **/
		// Player number modifier
		if (isInt(inputWords[inputWords.length - 1])) {
			interestModifier = inputWords.pop();
		}

		// Combine what's left in the input array as our command
		interestCommand = inputWords.join(" ");

		// Checks for specific command before running through game array
		if (interestCommand === "" && interestModifier === "") {
			showCurrentSessions("interest");
		} else if (interestCommand === "(game name)") {
			channel.sendMessage("smartass");
		} else {
			searchForGame(interestCommand, interestModifier);
		}

	// If first work is !remove keyword
	} else if (inputWords[0] === "!remove") {

		// Removes !remove keyword from input array
		inputWords.shift();

		var removeCommand = "";

		removeCommand = inputWords.join(" ");

		// Attempts to find session
		var sessionPosition = searchForSession(removeCommand);

		var isMod = message.member.roles.exists("name" ,"FartBoys");
		var didCreateSession = false;

		if (sessionPosition != null) {
			didCreateSession =  message.author.username === sessions[sessionPosition].players[0];
		}

		// Checks if the user has a moderator role or created the session
		if (!isMod && !didCreateSession) {
			channel.sendMessage("You don't have permission to do that. Ha ha, loser.");
		// If session couldn't be found with input
		} else if (sessionPosition === null) {
			// If posted only "!remove"
			if (removeCommand === "") {
				showCurrentSessions("remove");
			// If content was sarcasm
			} else if (removeCommand === "(game number)") {
				channel.sendMessage("why don't you go remove yourself, funny guy");
			// If content after remove isn't just a single integer
			} else if (!isInt(removeCommand)) {
				channel.sendMessage("You're freaking me out here.");
			// If they're trying to remove something under 1
			} else if (removeCommand <= 0) {
				channel.sendMessage("I'm pretty sure you know that's wrong.");
			// If the session just couldn't be found legitimately 
			} else {
				channel.sendMessage("I don't know what you think is going on here but that session doesn't exist.");
			}
		} else {
			channel.sendMessage(sessions[sessionPosition].game + " removed. Way to go.");
			sessions.splice(sessionPosition, 1);
			saveSessions();
		}

	} else if (inputWords[0] === "!join") {

		// Removes !join keyword from input array
		inputWords.shift();

		var joinCommand = "";

		joinCommand = inputWords.join(" ");

		if (joinCommand === "") {
			showCurrentSessions("join");
		}else if (joinCommand === "(game number)") {
			channel.sendMessage("you're the worst");
		} else if (joinCommand <= 0) {
			channel.sendMessage("I don't think so Tim.");
		} else if (isInt(joinCommand)) {
			var sessionId = searchForSession(joinCommand);
			if (sessionId != null) {
				addUserToSession(sessionId);
			} else {
				channel.sendMessage("That session doesn't exist. Try harder.");
			}
		} else {
			channel.sendMessage("I don't know what that means. I'm just a robot.");
		}

	// Game of the month mention check
	} else if (input.indexOf("gotm") !== -1 || input.indexOf("game of the month") !== -1) {
		channel.sendMessage("*long fart sound*");
	}


	// Shows the current interest checks going on
	function showCurrentSessions(keyword) {

		var sessionsString = ""

		for (var i = 0; i < sessions.length; i++) {

			var session = sessions[i];

			if (i === 0) {
				sessionsString += "\n\nCurrent interests:";
			}

			sessionsString += "\n\n" + session.id + ". " + session.game;

			var playersNeeded = session.maxPlayers-session.players.length;
			sessionsString += "\n" + session.players.length + "/" + session.maxPlayers + " players. ";

			if (playersNeeded == 1) {
				sessionsString +=  playersNeeded + " player needed.";
			} else {
				sessionsString +=  playersNeeded + " players needed.";
			}

			var playersString = "";

			for (var j = 0; j < session.players.length; j++) {
				if (j != session.players.length - 1) {
					playersString += session.players[j] + ", "
				} else {
					playersString += session.players[j]
				}
			}

			sessionsString += "\nPlayers: " + playersString;
		}

		var keywordString = "";

		if (keyword === "interest") {
			keywordString = "Enter !interest (game name) to gauge interest in some of these fuckbuckets wanting to play something. HINT: They don't.";
		} else if (keyword === "remove") {
			keywordString = "Enter !remove (game number) to remove that session. Pretty straightforward to be honest."
		} else if (keyword === "join") {
			keywordString = "Enter !join (game number) to show you're interested in playing that game. Then hope they don't hate you."
		}

		channel.sendMessage(keywordString + sessionsString);
	}


	// Searches through games array keywords for specific game name
	function searchForGame(interest, modifier) {

		var game = null;

		for (var i = 0; i < games.length; i++) {
			for (var j = 0; j < games[i].nickNames.length; j++) {
				if (interest === games[i].nickNames[j]) {
					game = games[i];
				}
			}
		}

		// If the game is found...
		if (game != null) {

			// If modifier is empty start the game with max players
			if (modifier === "") {
				createSession(game, game.maxPlayers);
			// If it isn't...
			} else {
				// And is an integer...
				if (isInt(modifier)) {
					if (modifier > game.maxPlayers) {
						channel.sendMessage("I'll let you know when " + game.name + " comes out with an expansion for " + modifier + " players.");
					} else if (modifier == 1) {
						channel.sendMessage("No one wants to know about you playing with yourself.");
					} else if (modifier <= 0) {
						channel.sendMessage("What are you doing.");
					} else {
						createSession(game, modifier);
					}
				}
			}
		// If the game is not found
		} else {
			channel.sendMessage("Look, it seems you need some help. Try entering !interest (game name) to start an interest check.");
		}
	}


	function createSession(game, players) {

		if (sessions.length >= 10) {
			channel.sendMessage("There's plenty of interest for games right now. Why don't you try one of them, you greedy fucker?");
		} else {

			var Session = {};

			Session.id = findLowestUnusedIdNumber()
			Session.game = game.name;
			Session.players = [];
			Session.players.push(message.author.username);
			Session.maxPlayers = players;

			sessions.push(Session);

			sessions.sort(function(a, b) {
			    return a.id - b.id;
			});

			saveSessions();

			// console.log(sessions);

			var botMessage = message.author.username + " wants to start a game of " + game.name + ". Type !join " + Session.id + " to join the game."

			channel.sendMessage(botMessage);
		}
	}


	function addUserToSession(id) {

		if (sessions[id].players.length === sessions[id].maxPlayers) {
			channel.sendMessage("That session is full. It's okay, they probably didn't want to play with you anyway.");
		} else if (searchForPlayers(id, message.author.username)){
			channel.sendMessage("You're already in that session of " + sessions[id].game + ". You knew that, right?");
		} else {
			sessions[id].players.push(message.author.username);
			channel.sendMessage(message.author.username + " is also interested in playing game of " + sessions[id].game + ".");
			saveSessions();
		}
	}
});


function searchForSession(id) {

	for (var i = 0; i < sessions.length; i++) {
		if (sessions[i].id == id) {
			return i;
		}
	}

	return null;
}


function searchForPlayers(id, player) {

	for (var i = 0; i < sessions[id].players.length; i++) {
		if (sessions[id].players[i] == player) {
			return true;
		}
	}

	return false;
}


function findLowestUnusedIdNumber() {

	if (sessions.length == 0) {
	    return 1
	}

	for (var i = 0; i < sessions.length; i++) {
	    if (sessions[i].id != i + 1) {
	        return i + 1;
	    }
	}

	return sessions.length + 1;
}


// Checks if passed value is an integer
function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}


function saveSessions() {

	fs.writeFile(__dirname + "/sessions.txt", JSON.stringify(sessions), function(err) {
		if (err) {
			return console.log(err);
		}

		console.log("The file was saved!");
	});
}


// Logs GameBot in
gameBot.login("MjE5NjQzNzA0NTAyMjU1NjE3.CrTftg.9Ksqq8rqeUcMDA67L_W_bQOsDKY");