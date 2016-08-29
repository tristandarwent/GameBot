var Discord = require("discord.js");

var gameBot = new Discord.Client();

var games = [
	{name: "Carcassonne", players: 5, nickNames: ["carc", "carcassonne"]},
	{name: "Lost Cities", players: 2, nickNames: ["cuties", "lost cities", "lost cuties"]}
];

gameBot.on("message", function(message) {

	var input = message.content.toLowerCase();

	if (input.startsWith("!interest")) {

		var interestCommand = input.slice(10);
		interestCommand = interestCommand.trim();

		console.log(interestCommand);

		if (interestCommand === "") {
			gameBot.sendMessage(message, "Enter !interest (game) to gauge interest in some of these fuckbuckets wanting to play something. HINT: They don't.");
		} else if (input === "(game)") {
			gameBot.sendMessage(message, "smartass");
		} else {
			searchForGame(interestCommand);
		}
	}

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

gameBot.loginWithToken("TOKEN GOES HERE");