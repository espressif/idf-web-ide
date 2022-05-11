[![GitHub release](https://img.shields.io/github/release/espressif/idf-web-ide.svg?style=flat-square)](https://github.com/espressif/idf-web-ide/releases/latest)
[![CI workflow](https://img.shields.io/github/workflow/status/espressif/idf-web-ide/Publish%20docker%20image?label=Docker%20release&logo=docker)](https://github.com/espressif/idf-web-ide/actions?workflow=Publish%20docker%20image)

# Espressif IDF WEB IDE

This is the home for cloud/ desktop based IDE for [ESP-IDF](https://github.com/espressif/esp-idf) for quick development with Espressif devices.

## Getting started

### Run as Docker Container (_suggested_)

- Pull the latest or an existing version from [Docker Hub](https://hub.docker.com/r/espbignacio/idf-web-ide):

    `docker pull espbignacio/idf-web-ide`

- Build Docker Image using the DockerFile

    `$ docker build . --tag espressif/idf-web-ide`

- Create and Start a container from that image, notice we are mounting host OS `${PWD}` to `/home/projects` of the container

    `$ docker run -d -e IWI_PORT=8080 -p 8080:8080 -v ${PWD}:/home/projects espressif/idf-web-ide`

- Open `http://0.0.0.0:8080` in your browser (_use chrome for best experience_)

### Run Directly from Source

- `$ git clone https://github.com/espressif/idf-web-ide.git`
- `$ cd idf-web-ide`
- Run `$ yarn` (_nodejs, yarn is required for this step_)
- `$ cd browser-app`
- `$ yarn run start --port=8080`
- Open `127.0.0.1:8080` in your browser (_use chrome for best experience_)
