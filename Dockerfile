FROM node:argon

RUN npm install --save discord.js

WORKDIR /usr/src/app

VOLUME /usr/src/app

#COPY gameBot.js /usr/src/app
#COPY sessions.txt /usr/src/app
#COPY bot_token.json /usr/src/app

EXPOSE 8080

CMD [ "node", "gameBot.js" ]
