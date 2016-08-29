var Discord = require("discord.js");

var gameBot = new Discord.Client();


// Array of game objects
var games = [
	{name: "Carcassonne", players: 5, nickNames: ["carc", "carcassonne"]},
	{name: "Lost Cities", players: 2, nickNames: ["cuties", "lost cities", "lost cuties"]}
];


// Runs on every message posted in discord
gameBot.on("message", function(message) {

	// Converts message content to lowercase
	var input = message.content.toLowerCase();

	// Check to see if message starts with !interest keyword
	if (input.startsWith("!interest")) {

		// Checks to see if just "!interest" alone was posted
		if (input.trim() === "!interest") {
			gameBot.sendMessage(message, "Enter !interest (game) to gauge interest in some of these fuckbuckets wanting to play something. HINT: They don't.");
		}

		// Grabs any content posted after !interest
		var interestCommand = input.slice(9);

		console.log(interestCommand);


		// Checks to make sure a space has been placed between !interest and any other command
		if (interestCommand.charAt(0) === " ") {

			// Trims all whitespace at ends of the command
			interestCommand = interestCommand.trim();

			// Checks for specific command before running through game array
			if (interestCommand === "(game)") {
				gameBot.sendMessage(message, "smartass");
			} else {
				searchForGame(interestCommand);
			}
		}
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
			gameBot.sendMessage(message, "Invalid command, you muppet.");
		}
	}



	function startGame(game) {

		var botMessage = message.author.username + " wants to start a game of " + game.name + ". Type !join to join the game."

		gameBot.sendMessage(message, botMessage);
	}
});


// Logs GameBot in
gameBot.loginWithToken("TOKEN GOES HERE");