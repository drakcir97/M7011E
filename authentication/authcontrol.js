var jwt = require('jsonwebtoken');
var express = require('express');
const app = express()

module.exports = {
    'secret': 'supersecret'
};

function register(userid) {
    var token = jwt.sign({ id: userid }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
    });
    return token;
};