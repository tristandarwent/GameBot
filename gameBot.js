
/*
TODO:
	- limit on how many games can be added
	- limit on how many games a user can add
	- !start (think of a solution for this)
	- Mike: notifications for user/creator when a game is full
	- More games support
	- 
	- add timestamps to sessions
	- automatic timeouts for stale games (24 hours)
	- remove full games after a time?
	- Full games get moved to their own section so players can see
	- Mike: refactor to make commands more generic/testable
	- Mike: unit tests
	- Mike: Player driven game suggesionts (!register?)
	- Games/nickname system (mods only)
	- user gamecenter/player name registration
	- Mike: more funny messages ala gotm
	- data driven messages/word match ups
	- Add volume support to docker, rather than importing the .js/session all the time
	- Add travis CI support
	- !trending command

*/


var Discord = require("discord.js");
var fs = require("fs");

var gameBot = new Discord.Client();

console.log("Running GameBot");

// Array of game objects
var games = [
	{name: "Carcassonne", maxPlayers: 5, nickNames: ["carc", "carcassonne"], hidden: false},
	{name: "Lost Cities", maxPlayers: 2, nickNames: ["cuties", "lost cities", "lost cuties"], hidden: false},
	{name: "Twilight Struggle", maxPlayers: 2, nickNames: ["twilight struggle", "twilight snuggle", "snuggle", "ts"], hidden: false},
	{name: "Agricola", maxPlayers: 5, nickNames: ["gric", "agricola"], hidden: false},
	{name: "Ascension", maxPlayers: 4, nickNames: ["ascension"], hidden: false},
	{name: "Le Havre", maxPlayers: 5, nickNames: ["le havre"], hidden: false},
	{name: "Patchwork", maxPlayers: 2, nickNames: ["patchwork", "patches"], hidden: false},
	{name: "Lords of Waterdeep", maxPlayers: 6, nickNames: ["lords of waterdeep", "waterdeep", "low", "lords"], hidden: false},
	{name: "Ticket To Ride", maxPlayers: 5, nickNames: ["ticket to ride", "ttr", "trains"], hidden: false},
	{name: "Tanto Cuore", maxPlayers: 4, nickNames: ["tanto cuore", "tanto", "cuore", "anime maids", "waifus"], hidden: true}
];


var sessions = [];


// Grabs the already exisiting sessions from sessions.txt
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

	// An array of the commands for the bot
	// NOTE(Mike): The help strings are a terrible horrible mess, perhaps move them out of h ere to a more editable/central place
	var commands = [
		{
			name: "interest", 
			func: interestCommand,
			shortHelpText: "Tell the world you're interested in a game!  Type !interest (game) to start off!",
			longHelpText: "Tell GameBot(TM) you want to play a game\n\t!interest: list all current games\n\t!interest (game name): Register your interest in playing (game name), with the default number of players.\n\t!interest (game name) (number of players): Register your interest in playing (game name), but with only for (number of players)"
		},
		{
			name: "remove", 
			func: removeCommand,
			shortHelpText: "Delete a game, because no one wants to play with you.",
			longHelpText: "Remove a specfic game from the list.  Only the starter of the game can do this.\n\t!remove: lists all current games\n\t!remove (game number): removes (game number) from the list of games people can join."
		},
		{
			name: "join", 
			func: joinCommand,
			shortHelpText: "Join someone elses game, get their hopes up!",
			longHelpText: "Join a game.\n\t!join: list all available games\n\t!join (game number): join the game with the same number as (game number)."
		},
		{
			name: "list",
			func: listCommand,
			shortHelpText: "List the current active games",
			longHelpText: "Get a list of the current active games.\n\t!list: list all current games\n\t!list (game name): List all games of (game name)."
		},
		{
			name: "help", 
			func: helpCommand,
			shortHelpText: "Get help (...again).",
			longHelpText: "Find help about a specific comamnd.\n\t!help (command): get detailed information about a command, and maybe the answer to life itself."
		},
	];

	// Converts message content to lowercase
	var input = message.content.toLowerCase();

	// Removes all unecessary spaces (double/triple spaces, leading, trailing, etc.)
	input = input.replace(/\s{2,}/g, ' ');

	// Breaks input into seperate words
	var inputWords = input.split(" ");

  	for (var commandIndex = 0; commandIndex < commands.length; commandIndex++) {

	    if (inputWords[0] === ("!" + commands[commandIndex].name)) { 

	      // remove the command name
	      inputWords.shift();

	      // run the command, passing in the remaining arguments for the command
	      // to parse itself
	      commands[commandIndex].func(inputWords);
	      return;
	    }
  	}

  	// If no commands are found, check here.
	// Game of the month mention check
  	if (input.indexOf("gotm") !== -1 || input.indexOf("game of the month") !== -1) {
		gameBot.sendMessage(message, "*long fart sound*");
	}


	/*** !INTEREST ***/
	function interestCommand(inputWords) {
	    console.log(sessions);
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
			gameBot.sendMessage(message, "smartass");
		} else {
			searchForGame(interestCommand, interestModifier);
		}
	}


	/*** !REMOVE ***/
  	function removeCommand(inputWords) {
		var removeCommand = "";

		removeCommand = inputWords.join(" ");

		// Attempts to find session
		var sessionPosition = searchForSession(removeCommand);

		var isMod = message.author.hasRole("219480175103049728");
		var didCreateSession = false;

		if (sessionPosition != null) {
			didCreateSession =  message.author.username === sessions[sessionPosition].players[0];
		}

		// Checks if the user has a moderator role or created the session
		if (!isMod && !didCreateSession) {
			gameBot.sendMessage(message, "You don't have permission to do that. Ha ha, loser.");
		// If session couldn't be found with input
		} else if (sessionPosition === null) {
			// If posted only "!remove"
			if (removeCommand === "") {
				showCurrentSessions("remove");
			// If content was sarcasm
			} else if (removeCommand === "(game number)") {
				gameBot.sendMessage(message, "why don't you go remove yourself, funny guy");
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
			saveSessions();
		}
  	}


  	/*** !JOIN ***/
  	function joinCommand(inputWords) {
		var joinCommand = "";

		joinCommand = inputWords.join(" ");

		if (joinCommand === "") {
			showCurrentSessions("join");
		} else if (joinCommand === "(game number)") {
			gameBot.sendMessage(message, "you're the worst");
		} else if (joinCommand <= 0) {
			gameBot.sendMessage(message, "I don't think so Tim.");
		} else if (isInt(joinCommand)) {
			var sessionId = searchForSession(joinCommand);
			if (sessionId != null) {
				addUserToSession(sessionId);
			} else {
				gameBot.sendMessage(message, "That session doesn't exist. Try harder.");
			}
		} else {
			gameBot.sendMessage(message, "I don't know what that means. I'm just a robot.");
		}
  	}


  	/*** !HELP ***/
	function helpCommand(inputWords) {
		var helpString = "";
	    if (inputWords.length > 1) { 
 			helpString += "Just type !help for more info (seriously, get help)";
		}	
		else if (inputWords.length == 1) {
			if(inputWords[0] === "games") { // Are they just asking for a list of games?
				helpString += "Here are the games GameBot(TM) cares about:\n\n"
				for (var gameIndex = 0; gameIndex < games.length; gameIndex++) {
					if(games[gameIndex].hidden === false) {
						helpString += "\t";
						helpString += games[gameIndex].name;
						helpString += "\n";
					}
				}
			}
			else { // Try and match the word given to a command
				var foundCommand = false;
				for (var commandIndex = 0; commandIndex < commands.length; commandIndex++) {
					if (inputWords[0] === commands[commandIndex].name) {
						foundCommand = true;
						helpString += commands[commandIndex].longHelpText;
					}
				}
				if (foundCommand === false) {  // Iditos!
					helpString += "I don't know about the command \"";
					helpString += inputWords[0];
					helpString += "\", why don't you try something else, you muppet!";
				}
			}	
		}
		else {
			helpString += "GameBot (TM): servicing your game bot needs! Type the following into chat to talk to GameBot (TM)\n\n";
			// Build a string similar to 
			// !<commandName>: <ShortHelpText>
			for (var commandIndex = 0; commandIndex < commands.length; commandIndex++) {
				helpString += "\t !";
			    helpString += commands[commandIndex].name;
			    helpString += ": ";
				helpString += commands[commandIndex].shortHelpText;
				helpString += "\n";
			}

			helpString += "\nType !help games to get a list of all available games.";
			helpString += "\nType !help (command) for more information about that command.";
	    }	
		//
		// Finally, send the built message
		gameBot.sendMessage(message, helpString); 
	}
 
	function listCommand(inputWords) {
		if (inputWords.length === 0) {
			showCurrentSessions("list")
		}
		else if(inputWords.length === 1) { // Passed a game name...
			requestedGame = findGameByNickname(inputWords[0]);
		    if (requestedGame != null) {
				showCurrentSessions("list", requestedGame.name);
			} else {
				gameBot.sendMessage(message, "list: what did you call me?");
			}
		}
		else {
			gameBot.sendMessage(message, "list: you want to list what?");
		}
	}

  	// Shows the current interest checks going on
	function showCurrentSessions(keyword, gameName) {

		var sessionsString = "";
		var sessionsFound = 0;

		for (var i = 0; i < sessions.length; i++) {

			var session = sessions[i];

			// don't add the game to the list if we've specified a filter
			if(gameName != null && session.game != gameName)
				continue;

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
			sessionsFound += 1;
		}

		var keywordString = "";

		if (keyword === "interest") {
			keywordString = "Enter !interest (game name) to gauge interest in some of these fuckbuckets wanting to play something. HINT: They don't.";
		} else if (keyword === "remove") {
			keywordString = "Enter !remove (game number) to remove that session. Pretty straightforward to be honest."
		} else if (keyword === "join") {
			keywordString = "Enter !join (game number) to show you're interested in playing that game. Then hope they don't hate you."
		} 

		if (sessionsFound == 0) {
			sessionsString = "No sessions found\n" + sessionsString;
		} else {
			sessionsString = "\n\nCurrent interests (" + sessionsFound + "):" + sessionsString;
		}

		gameBot.sendMessage(message, keywordString + sessionsString);
	}


	// given a nickname, find the game relating to it. 
	function findGameByNickname(nickName) {
		for (var i = 0; i < games.length; i++) {
			for (var j = 0; j < games[i].nickNames.length; j++) {
				if (nickName === games[i].nickNames[j]) {
					return games[i];
				}
			}
		}

		return null;
	}

	// Searches through games array keywords for specific game name
	function searchForGame(interest, modifier) {
		var game = findGameByNickname(interest);

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
						gameBot.sendMessage(message, "I'll let you know when " + game.name + " comes out with an expansion for " + modifier + " players.");
					} else if (modifier == 1) {
						gameBot.sendMessage(message, "No one wants to know about you playing with yourself.");
					} else if (modifier <= 0) {
						gameBot.sendMessage(message, "What are you doing.");
					} else {
						createSession(game, modifier);
					}
				}
			}
		// If the game is not found
		} else {
			gameBot.sendMessage(message, "Look, it seems you need some help. Try entering !interest (game name) to start an interest check.");
		}
	}


	// Creates a new session
	function createSession(game, players) {

		if (sessions.length >= 10) {
			gameBot.sendMessage(message, "There's plenty of interest for games right now. Why don't you try one of them, you greedy fucker?");
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

			gameBot.sendMessage(message, botMessage);
		}
	}


	// Adds the user to passed session if the user isn't already in it or the session isn't full
	function addUserToSession(id) {

		if (sessions[id].players.length === sessions[id].maxPlayers) {
			gameBot.sendMessage(message, "That session is full. It's okay, they probably didn't want to play with you anyway.");
		} else if (searchForPlayers(id, message.author.username)){
			gameBot.sendMessage(message, "You're already in that session of " + sessions[id].game + ". You knew that, right?");
		} else {
			sessions[id].players.push(message.author.username);
			gameBot.sendMessage(message, message.author.username + " is also interested in playing game of " + sessions[id].game + ".");
			saveSessions();
		}
	}
});


// Search for the session with the id that is passed
function searchForSession(id) {

	for (var i = 0; i < sessions.length; i++) {
		if (sessions[i].id == id) {
			return i;
		}
	}

	return null;
}


// Search for player within a specfic session
function searchForPlayers(id, player) {

	for (var i = 0; i < sessions[id].players.length; i++) {
		if (sessions[id].players[i] == player) {
			return true;
		}
	}

	return false;
}


// Finds the lowest id number that is currently not being used
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
  return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}


// Save the sessions array to permanent .txt file
function saveSessions() {

	fs.writeFile(__dirname + "/sessions.txt", JSON.stringify(sessions), function(err) {

		if (err) {
			return console.log(err);
		}

		console.log("The file was saved!");
	});
}


// We are expecting the token file to be JSON, with a "token" field
// with the value set to the bot's token.
function getToken() {
	var contents = fs.readFileSync(__dirname + "/bot_token.json", 'utf8');
	jsonData = JSON.parse(contents);
	return jsonData.token;
}


var token = getToken();
gameBot.loginWithToken(token);
//gameBot.loginWithToken("INSERT TOKEN HERE")
