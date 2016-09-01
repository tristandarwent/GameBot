FROM node:4-onbuild

RUN mkdir -d /usr/src/gamebot
WORKDIR /usr/src/gamebot

COPY gameBot.js /usr/src/gamebot/

EXPOSE 80

CMD[ "node", "gameBot.js" ]
