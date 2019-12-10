var express = require('express')
var app = express()
var https = require('https')
var path = require('path')
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var fs = require('fs');
var mysql = require('mysql');
var authenticator = require("../authentication/authcontrol");
'use strict';
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

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

var mime = {
        html: 'text/html',
        txt: 'text/plain',
        css: 'text/css',
        gif: 'image/gif',
        jpg: 'image/jpeg',
        png: 'image/png',
        svg: 'image/svg+xml',
        js: 'application/javascript'
};

var captcha = ["SNAKE","JSON","CAPTCHA","PASSWORD","TEST","ANSWER"];


var dir = path.join(__dirname, 'images/captcha');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());

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

function saltHashPassword(userpassword, salt) {
        var passwordData = sha512(userpassword, salt);
        console.log('userpassword = '+userpassword);
        console.log('passwordhash = '+passwordData.passwordHash);
        console.log('nSalt = '+passwordData.salt);
        return passwordData
}

function HashPassword(userpassword) {
        var salt = genRandomString(16);
        return saltHashPassword(userpassword, salt); 
} 


app.get('/', (req, res) => {
      res.sendFile('index.html', {root : './'})
      //__dirname : It will resolve to your project folder.
});

app.post('/login', function(req, res) {
        //res.send('you sent the name "' + req.body.username + '".');
//        var testEncrypt = saltHashPassword(req.body.userpassword);
//        res.send("salt: "+testEncrypt.salt+" hash: "+testEncrypt.passwordHash);
        var sqlLogin = mysql.format("SELECT id FROM user WHERE email=?", [req.body.emailaddress]);
        con.query(sqlLogin, function(err, result) {
                if(err) throw err;
                var userid = result[0]['id'];
                var sqlUserId = mysql.format("SELECT pw,salt FROM passwords WHERE userid=?", [userid]);
                con.query(sqlUserId, function(err, result){
                        var pw = result[0]['pw'];
                        var salt = result[0]['salt'];
                        var saltedpw = saltHashPassword(req.body.userpassword,salt);
                        if (pw == saltedpw.passwordHash) {
                                var token = authenticator.register(userid);
                                res.cookie('token', token, { maxAge: 86400 })
                                //res.status(200).send({ auth: true, token: token })
                                res.redirect('/home');
                        } else {
                                //res.status(401).send({ auth: false, token: null });
                                res.redirect(404,'/');
                        }
                });
        }); 
});

app.get('/signup', (req, res) => {
        var file = path.join(dir, req.path.replace(/\/$/, '/signup.html'));
        if (file.indexOf(dir + path.sep) !== 0) {
                return res.status(403).end('Forbidden');
        }
        var type = mime[path.extname(file).slice(1)] || 'text/plain';
        var s = fs.createReadStream(file);
        s.on('open', function () {
                res.set('Content-Type', type);
                s.pipe(res);
        });
        s.on('error', function () {
                res.set('Content-Type', 'text/plain');
                res.status(404).end('Not found');
        });
        //res.sendFile('signup.html', {root : './'});
        //req.body.emailaddress;
        //req.body.name;
        //req.body.userpassword;
        
});

app.get('/signout', (req, res) => {
        res.sendFile('index.html', {root : './'});
        //req.body.emailaddress;
        //req.body.name;
        //req.body.userpassword;
        
});

app.get('/userpage', (req, res) => {
     //   var sqlSelectPicture = mysql.format("SELECT picture FROM user WHERE id=?")
      //  res.sendFile('user.html', {root : './'});
        //req.body.emailaddress;
        //req.body.name;
        //req.body.userpassword;
        
});

app.post('/addPicture', function(req, res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        var sqlInsertPicture = mysql.format("INSERT INTO user (picture) VALUES (?)", [req.body.picture]);
        con.query(sqlInsertPicture, function(err,result) {
                if(err){
                        //??
                } else {
                        //??
                }
        });
});

app.post('/signup', function(req, res) {
        var sqlSignup = mysql.format("INSERT INTO user (name,email) VALUES (?,?)", [req.body.name,req.body.emailaddress]);
        con.query(sqlSignup, function(err,result) {
                if (err){
                        res.redirect(404,'/signup');
                } else {
                        var sqlUserId = mysql.format("SELECT id FROM user WHERE name=? AND email=?", [req.body.name,req.body.emailaddress]);
                        con.query(sqlUserId, function(err,result) {
                                var userid = result[0]['id'];
                                var saltedpw = HashPassword(req.body.userpassword);
                                var sqlPassword = mysql.format("INSERT INTO passwords (userid,pw,salt) VALUES (?,?,?)", [userid, saltedpw.passwordHash, saltedpw.salt]);
                                con.query(sqlPassword, function(err, result) {
                                        if (err) throw err;
                                        res.redirect('/');   
                                });
                        });
                }
        });
});

app.get('/home', (req, res) => {
        // var token = req.headers['x-access-token'];
        // if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
        // jwt.verify(token, authenticator.secret, function(err, decoded) {
        //         if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
        //         res.status(200).send(decoded);
        // });
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        return res.status(token.id).end();
        //res.sendFile('home.html', {root : './'});
});

//https.createServer(options, function (req, res) {
//      res.writeHead(200);
//      res.end("hello");
//}).listen(3000);
https.createServer(options, app).listen(3000);


