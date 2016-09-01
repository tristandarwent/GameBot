FROM node:argon

WORKDIR /usr/src/app

RUN npm install --save discord.js

COPY gameBot.js /usr/src/app
COPY sessions.txt /usr/src/app
COPY bot_token.txt /usr/src/app

EXPOSE 8080

CMD [ "node", "gameBot.js" ]
