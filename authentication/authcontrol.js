var jwt = require('jsonwebtoken');
var express = require('express');
const app = express()

module.exports = {
    'secret': 'supersecret',
    register: function(userid) {
        var token = jwt.sign({ id: userid }, this.secret, {
            expiresIn: 86400 // expires in 24 hours
        });
        return token;
    },
};

