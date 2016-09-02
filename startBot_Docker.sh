#!/bin/bash

docker stop game
docker rm game
docker run -it --name game -v $(pwd):/usr/src/app/ gamebot:1
