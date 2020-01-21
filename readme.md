## Table of contents
* [General info](#general-info)
* [Technologies](#technologies)
* [Installation and use](#setup)
* [Launch](#launch)

## General info
A web system for controlling the production and consumption of electricity on a smaller scaled market including a simulator.
	
## Technologies
Project is created with:
* Node.js version: 13.0.1
* HTML version: 5
* MySQL version: 5.7.28
	
## Installation and use
Requirements: Node.js 13.0.1
```
$ git clone https://github.com/drakcir97/M7011E.git
$ npm install
$ cd M7011E
$ cd simulator
$ forever start simulator.js
$ cd ../restful-api
$ forever start index.js
$ cd ../server
$ forever start index.js
```

## Administrator
To create an administrator:

* Go to https://(your configured ip):3000/createadmin
* Log into the default administrator using normal sign in (username: sysadmin@miri, password: sysadmin)