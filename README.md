# GameBOT

This is a gamebot.

## Tokens
To login Create file with your bot token, called `bot_token.json`

That file must contain a field called token, with value being your given bots token to log into discord.

For example
```json
{
  "token": "YOURTOKEN"
}
```

This file isn't committed to git, and docker will pick it up and put it into your container automatically.  
