var jwt = require('jsonwebtoken');
var express = require('express');
const app = express()

module.exports = {
    'secret': 'supersecret',
    register: function(userid,admin) {
        var token = jwt.sign({ id: userid, admin: admin }, this.secret, {
            expiresIn: "2h" // expires in 2 hours
        });
        return token;
    },
};

