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
var formidable = require('formidable');
var net = require("net");

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


var dir = path.join(__dirname, 'server/images/captcha');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());
//app.use(bodyParser({onPart: onPart}));

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
                try {
                        var userid = result[0]['id'];
                } catch(err) {
                        return res.redirect('/');
                }
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
                                res.redirect('/');
                        }
                });
        }); 
});

function parse(str) {
        var args = [].slice.call(arguments, 1),
            i = 0;
    
        return str.replace(/%s/g, () => args[i++]);
}

app.get( '/captcha/:id', function( req, res ) {

        var s = parse('images/captcha/%s', req.params.id);
        fs.readFile( s, function( err, data ) {
      
          if ( err ) {
      
            console.log( err );
            return;
          }
          //req.body.usercaptcha
          res.write( data );
          return res.end();
        });
      
});

app.get('/signup', (req, res) => {
        console.log("test")
        // var file = path.join(dir, req.path.replace(/\/$/, '/signup.html'));
        // if (file.indexOf(dir + path.sep) !== 0) {
        //         return res.status(403).end('Forbidden');
        // }
        // var type = mime[path.extname(file).slice(1)] || 'text/plain';
        // console.log(type,"\n");
        // var s = fs.createReadStream(file);
        // s.on('open', function () {
        //         res.set('Content-Type', type);
        //         s.pipe(res);
        // });
        // s.on('error', function () {
        //         res.set('Content-Type', 'text/plain');
        //         res.status(404).end('Not found');
        // });
        res.sendFile('signup.html', {root : './'});
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
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                //res.sendFile('user.html', {root : './'});
                var socket = new net.Socket();
                //var host = parse('localhost/api/users/%s', JSON.stringify(decoded.id));
                var host = 'localhost/api/users';
                socket.connect({port: 8080,host: host}, function () {
                        console.log("Client: Connected to server");
                });

                // Let's handle the data we get from the server
                socket.on("data", function (data) {
                        data = JSON.parse(data);
                        console.log("Response from server: %s", data.response);
                        // Respond back
                        //socket.write(JSON.stringify({ response: "Hey there server!" }));
                        // Close the connection
                        socket.end();
                        res.write(data);
                        return res.end();
                });
        });
        //req.body.emailaddress;
        //req.body.name;
        //req.body.userpassword;
        
});

app.get( '/userimage', function( req, res ) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                var s = parse('images/userhouse/%s', JSON.stringify(decoded.id)+".jpg");
                fs.readFile( s, function( err, data ) {
      
                        if ( err ) {
      
                                console.log( err );
                                return;
                        }
                        //req.body.usercaptcha
                        res.write( data );
                        return res.end();
                });
        });
      
});

app.post('/addPicture', function(req, res) {
        console.log("test begin");
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("before sqlInsertPicture");
                console.log("id "+JSON.stringify(decoded.id));
                console.log(req.body.picture);
                // var sqlInsertPicture = mysql.format("INSERT INTO picture (userid,picture) VALUES (?,?)", [JSON.stringify(decoded.id),req.body.picture]);
                // con.query(sqlInsertPicture, function(err,result) {
                //         if(err){
                //                 console.log("Error when inserting image into db");
                //         } else {
                //                 console.log("Inserted picture into db");
                //         }
                // });

                var form = new formidable.IncomingForm();
                form.maxFileSize = 8 * 1024 * 1024;
                form.parse(req, function (err, fields, files) {
                        if (err) {
                                return res.send("102: FILE TOO LARGE (8MB MAX)");
                        }
                        var oldpath = files.picture.path;
                        var newpath = './images/userhouse/' + JSON.stringify(decoded.id)+".jpg";
                        console.log("oldpath "+oldpath);
                        console.log("newpath "+newpath);
                        fs.rename(oldpath, newpath, function (err) {
                                if (err){
                                        console.log(err);
                                } else {
                                        res.redirect('/');
                                }
                        });
                });
                // form.onPart = function (part) {
                //         if(!part.filename || part.filename.match(/\.(jpg|jpeg|png)$/i)) {
                                
                //         } else {
                //                 console.log(part.filename + ' is not allowed');
                //                 res.redirect('/');
                //         }
                // }
        });
});

app.post('/signup', function(req, res) {
        console.log(req.body.usercaptcha); //test captcha
        console.log(req.body.p2); 
        if (captcha[parseInt(req.body.p2)]==req.body.usercaptcha) {
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
        } else {
                res.redirect(404,'/signup');
        }
        
});

app.get('/home', (req, res) => {
        // var token = req.headers['x-access-token'];
        // if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
        });
        //return res.status(token.id).end();
        res.sendFile('home.html', {root : './'});
});

//https.createServer(options, function (req, res) {
//      res.writeHead(200);
//      res.end("hello");
//}).listen(3000);
https.createServer(options, app).listen(3000);


