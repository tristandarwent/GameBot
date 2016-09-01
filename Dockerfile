FROM node:argon

WORKDIR /usr/src/app

COPY gameBot.js /usr/src/app
COPY sessions.txt /usr/src/app
COPY bot_token.txt /usr/src/app

RUN npm install --save discord.js

EXPOSE 80

CMD [ "node", "gameBot.js" ]
