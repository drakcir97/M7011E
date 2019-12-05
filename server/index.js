var express = require('express')
var app = express()
var https = require('https')
var request = require('path')
var bodyParser = require('body-parser');
var fs = require('fs');
var mysql = require('mysql');
'use strict';
var crypto = require('crypto')

var options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
};

var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "password",
        database: "serverdb"
      });

app.use(bodyParser.urlencoded({ extended: true}));

//generate salt
var genRandomString = function(length){
        return crypto.randomBytes(Math.ceil(length/2))
                .toString('hex')
                .slice(0, length);
};

//hashing the password along with salt
var sha512 = function(password, salt){
        var hash = crypto.createHmac('sha512', salt);
        hash.update(password);
        var value = hash.digest('hex');
        return {
                salt:salt,
                passwordHash:value
        };
};

function saltHashPassword(userpassword) {
        var salt = genRandomString(16);
        var passwordData = sha512(userpassword, salt);
        console.log('userpassword = '+userpassword);
        console.log('passwordhash = '+passwordData.passwordHash);
        console.log('nSalt = '+passwordData.salt);
        return passwordData
}


app.get('/', (req, res) => {
      res.sendFile('index.html', {root : './'})
      //__dirname : It will resolve to your project folder.
});

app.post('/login', function(req, res) {
        //res.send('you sent the name "' + req.body.username + '".');
//        var testEncrypt = saltHashPassword(req.body.userpassword);
//        res.send("salt: "+testEncrypt.salt+" hash: "+testEncrypt.passwordHash);
        res.send("email "+req.body.emailaddress);
 //       var sqlLogin = mysql.format("SELECT id FROM user WHERE email=?", [req.body.emailaddress]);
 /**        con.query(sqlLogin, function(err, result) {
                if(err) throw err;
                var userid = result[0]['id'];
                var sqlUserId = mysql.format("SELECT pw FROM passwords WHERE userid=?", [userid]);
                con.query(sqlUserId, function(err, result){
                        var pw = result[0]['pw'];
                        if (pw == req.body.userpassword) {
                                res.sendFile('home.html', {root : './'});
                        }
                });
        }); */
});

app.get('/signup', (req, res) => {
        res.sendFile('signup.html', {root : './'});
        //req.body.emailaddress;
        //req.body.name;
        //req.body.userpassword;
        var sqlSignup = mysql.format("INSERT INTO user (name,email) VALUES (?,?)", [req.body.name,req.body.emailaddress]);
        con.query(sqlSignup, function(err,result) {
                if (err) throw err;
                var sqlUserId = mysql.format("SELECT id FROM user WHERE name=? AND email=?", [req.body.name,req.body.emailaddress]);
                con.query(sqlUserId, function(err,result) {
                        var userid = result[0]['id'];
                        var sqlPassword = mysql.format("INSERT INTO passwords (userid,pw) VALUES (?,?)", [userid, req.body.userpassword]);
                        con.query(sqlPassword, function(err, result) {
                                if (err) throw err;   
                        });
                });
        });
});

app.get('/home', (req, res) => {
        res.sendFile('home.html', {root : './'});
});

//https.createServer(options, function (req, res) {
//      res.writeHead(200);
//      res.end("hello");
//}).listen(3000);
https.createServer(options, app).listen(3000);


