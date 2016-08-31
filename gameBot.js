var Discord = require("discord.js");

var gameBot = new Discord.Client();


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
	{name: "Ticket To Ride", maxPlayers: 5, nickNames: ["ticket to ride", "ttr", "trains"]}
];

var sessions = [];


// Runs on every message posted in discord
gameBot.on("message", function(message) {

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

		// console.log(interestCommand);
		// console.log(interestModifier);

		// Checks for specific command before running through game array
		if (interestCommand === "") {
			showCurrentSessions("interest");
		} else if (interestCommand === "(game name)") {
			gameBot.sendMessage(message, "smartass");
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

		var isMod = message.author.hasRole("219480175103049728");
		var didCreateSession = false;
		if (sessionPosition != null) {
			didCreateSession =  message.author.username === sessions[sessionPosition].players[0];
		}

		// if (isMod) {
		// 	console.log("IS MOD: true");
		// } else {
		// 	console.log("IS MOD: false");
		// }
		// // console.log("IS MOD: " + isMod);
		// console.log("CREATED SESSION: " + didCreateSession);

		// Checks if the user has a moderator role or created the session
		if (!isMod && !didCreateSession) {
			gameBot.sendMessage(message, "You don't have permission to do that. Ha ha, loser.");
		// If session couldn't be found with input
		} else if (sessionPosition === null) {
			// If posted only "!remove"
			if (removeCommand === "") {
				showCurrentSessions("remove");
			// If content after remove isn't just a single integer
			} else if (!isInt(removeCommand)) {
				gameBot.sendMessage(message, "You're freaking me out here.");
			// If they're trying to remove something under 1
			} else if (removeCommand <= 0) {
				gameBot.sendMessage(message, "I'm pretty sure you know that's wrong.");
			// If the session just couldn't be found legitimately 
			} else {
				gameBot.sendMessage(message, "I don't know what you think is going on here but that session doesn't exist.");
			}
		} else {
			gameBot.sendMessage(message, sessions[sessionPosition].game + " removed. Way to go.");
			sessions.splice(sessionPosition, 1);
		}

	// Game of the month mention check
	} else if (input.indexOf("gotm") !== -1 || input.indexOf("game of the month") !== -1) {
		gameBot.sendMessage(message, "*long fart sound*");
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

		var keywordString = "";

		if (keyword === "interest") {
			keywordString = "Enter !interest (game name) to gauge interest in some of these fuckbuckets wanting to play something. HINT: They don't.";
		} else if (keyword === "remove") {
			keywordString = "Enter !remove (session number) to remove that session. Pretty straightforward to be honest."
		}

		gameBot.sendMessage(message, keywordString + sessionsString);
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
				startGame(game, game.maxPlayers);
			// If it isn't...
			} else {
				// And is an integer...
				if (isInt(modifier)) {
					if (modifier > game.maxPlayers) {
						gameBot.sendMessage(message, "I'll let you know when " + game.name + " comes out with an expansion for " + modifier + " players.");
					} else if (modifier == 1) {
						gameBot.sendMessage(message, "No one wants to know about you playing with yourself.");
					} else if (modifier <= 0) {
						gameBot.sendMessage(message, "What are you doing.");
					} else {
						startGame(game, modifier);
					}
				}
			}
		// If the game is not found
		} else {
			gameBot.sendMessage(message, "Look, it seems you need some help. Try entering !interest (game name) to start an interest check.");
		}
	}


	function startGame(game, players) {

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

		// console.log(sessions);

		var botMessage = message.author.username + " wants to start a game of " + game.name + ". Type !join to join the game."

		gameBot.sendMessage(message, botMessage);
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


// Logs GameBot in
gameBot.loginWithToken("TOKEN GOES HERE");