var Discord = require("discord.js");

var gameBot = new Discord.Client();


// Array of game objects
var games = [
	{name: "Carcassonne", maxPlayers: 5, nickNames: ["carc", "carcassonne"]},
	{name: "Lost Cities", maxPlayers: 2, nickNames: ["cuties", "lost cities", "lost cuties"]}
];

var sessions = [];

// Runs on every message posted in discord
gameBot.on("message", function(message) {

	// Converts message content to lowercase
	var input = message.content.toLowerCase();

	// Check to see if message starts with !interest keyword
	if (input.startsWith("!interest")) {

		// Checks to see if just "!interest" alone was posted
		if (input.trim() === "!interest") {
			showCurrentSessions();
		}

		// Grabs any content posted after !interest
		var interestCommand = input.slice(9);

		console.log(interestCommand);


		// Checks to make sure a space has been placed between !interest and any other command
		if (interestCommand.charAt(0) === " ") {

			// Trims all whitespace at ends of the command
			interestCommand = interestCommand.trim();

			// Checks for specific command before running through game array
			if (interestCommand === "(game name)") {
				gameBot.sendMessage(message, "smartass");
			} else {
				searchForGame(interestCommand);
			}
		}
	} else if (input.indexOf("gotm") !== -1 || input.indexOf("game of the month") !== -1) {
		gameBot.sendMessage(message, "*long fart sound*");
	}


	function showCurrentSessions() {

		var sessionsString = ""

		for (var i = 0; i < sessions.length; i++) {

			if (i === 0) {
				sessionsString += "\n\nCurrent interests:";
			}

			var session = sessions[i];

			sessionsString += "\n\n" + session.game;

			var playersNeeded = session.maxPlayers-session.players.length;
			sessionsString += "\n" + session.players.length + "/" + session.maxPlayers + " players. ";

			if (playersNeeded > 1) {
				sessionsString +=  playersNeeded + " players needed.";
			} else {
				sessionsString +=  playersNeeded + " player needed.";
			}

			for (var j = 0; j < session.players.length; j++) {
				
				var playersString = "";

				if (j != session.players.length) {
					playersString += session.players[i] + ", "
				} else {
					playersString += session.players[i]
				}

				sessionsString += "\nPlayers: " + session.players[j];
			}
		}

		gameBot.sendMessage(message, "Enter !interest (game name) to gauge interest in some of these fuckbuckets wanting to play something. HINT: They don't." + sessionsString);
	}


	// Searches through games array keywords for specific game name
	function searchForGame(interest) {

		var gameFound = false;

		for (var i = 0; i < games.length; i++) {
			for (var j = 0; j < games[i].nickNames.length; j++) {
				if (interest === games[i].nickNames[j]) {
					startGame(games[i]);
					gameFound = true;
				}
			}
		}

		if (!gameFound) {
			gameBot.sendMessage(message, "Look, it seems you need some help. Try entering !interest (game name) to start an interest check.");
		}
	}



	function startGame(game) {

		var Session = {};

		Session.game = game.name;
		Session.players = [];
		Session.players.push(message.author.username);
		Session.maxPlayers = game.maxPlayers;

		sessions.push(Session);

		console.log(sessions);

		var botMessage = message.author.username + " wants to start a game of " + game.name + ". Type !join to join the game."

		gameBot.sendMessage(message, botMessage);
	}
});


// Logs GameBot in
gameBot.loginWithToken("TOKEN GOES HERE");