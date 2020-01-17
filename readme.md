## Table of contents
* [General info](#general-info)
* [Technologies](#technologies)
* [Installation](#setup)
* [Launch](#launch)

## General info
A web system for controlling the production and consumption of electricity on a smaller scaled market including a simulator.
	
## Technologies
Project is created with:
* Node.js version: 13.0.1
* HTML version: 5
* MySQL version: 5.7.28
	
## Installation
Requirements: Node.js 13.0.1 with following npm installs:
* cookie-parser@1.4.4
* express@4.17.1
* formidable@1.2.1
* gaussian@1.1.0
* jsonwebtoken@8.5.1
* mysql@2.17.1
* net@1.0.2
* node-datetime@2.1.2
* path.join@1.0.0
* random-normal@1.0.0
* request@2.88.0
* socket.io@2.3.0

## Launch
To run this project:

```
$ cd M7011E
$ cd simulator
$ forever start simulator.js
$ cd ../restful-api
$ forever start index.js
$ cd ../server
$ forever start index.js
```