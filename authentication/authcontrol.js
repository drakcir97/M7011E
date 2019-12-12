var jwt = require('jsonwebtoken');
var express = require('express');
const app = express()

module.exports = {
    'secret': 'supersecret',
    register: function(userid,admin) {
        var token = jwt.sign({ id: userid, admin: admin }, this.secret, {
            expiresIn: 86400 // expires in 24 hours
        });
        return token;
    },
};

