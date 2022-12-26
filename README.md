[![GitHub release](https://img.shields.io/github/release/espressif/idf-web-ide.svg?style=flat-square)](https://github.com/espressif/idf-web-ide/releases/latest)
![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/espressif/idf-web-ide/docker-push.yml?label=Dockerhub%20push%20status&logo=docker)
[![Docker Releases](https://img.shields.io/badge/-Docker%20Releases-blue)](https://hub.docker.com/r/espbignacio/idf-web-ide)
# Espressif IDF WEB IDE

This is the home for cloud/ desktop based IDE for [ESP-IDF](https://github.com/espressif/esp-idf) for quick development with Espressif devices.

## Getting started

### Run as Docker Container (_suggested_)

- Pull the latest or an existing version from [Docker Hub](https://hub.docker.com/r/espbignacio/idf-web-ide):

  `docker pull espbignacio/idf-web-ide`

- Build Docker Image using the DockerFile

  `$ docker build . --tag espressif/idf-web-ide --platform linux/amd64`

- Create and Start a container from that image, notice we are mounting host OS `${PWD}` to `/home/projects` of the container

  `$ docker run -d -e IWI_PORT=8080 -p 8080:8080 --platform linux/amd64 -v ${PWD}:/home/projects espressif/idf-web-ide`

- Open `http://0.0.0.0:8080` in your browser (_use chrome for best experience_)

### Run Directly from Source

- `$ git clone https://github.com/espressif/idf-web-ide.git`
- `$ cd idf-web-ide`
- Run `$ yarn` (_nodejs, yarn is required for this step_)
- `$ cd browser-app`
- `$ yarn run start --port=8080`
- Open `127.0.0.1:8080` in your browser (_use chrome for best experience_)

### Use the desktop companion to flash and monitor local Espressif devices

Using the [Espressif IDF Web Desktop Companion](https://github.com/espressif/iwidc/) you can remotely flash and monitor an Espressif device from this IDF Web IDE.

You can get a built executable from Windows [here](https://github.com/espressif/iwidc/releases).

- `.\dist\main.exe --port PORT` with the executable to start the desktop companion and `.\dist\main.exe` to see available ports.

From source code run:

- `pip3 install -r ${ESP-IWIDC}/requirements.txt` to install the python requirements.
- `python3 main.py` to see available serial ports.
- `python3 main.py --port [SERIAL_PORT_OF_ESP_32]` to start desktop companion.
