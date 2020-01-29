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
var config = require("../config/serverconfig");
var apiconfig = require("../config/apiconfig");
var options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
};

var con = mysql.createConnection({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database
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
        var token = req.cookies.token;
        if (!token) {
                return res.sendFile('index.html', {root : './'})
        } else {
                return res.redirect('/home');
        }
        //__dirname : It will resolve to your project folder.
});

app.post('/login', function(req, res) {
        //res.send('you sent the name "' + req.body.username + '".');
//        var testEncrypt = saltHashPassword(req.body.userpassword);
//        res.send("salt: "+testEncrypt.salt+" hash: "+testEncrypt.passwordHash);
        var sqlLogin = mysql.format("SELECT id,admin FROM user WHERE email=?", [req.body.emailaddress]);
        con.query(sqlLogin, function(err, result) {
                if(err) throw err;
                try {
                        var userid = result[0]['id'];
                        var admin = result[0]['admin'];
                        console.log("admin "+admin);
                } catch(err) {
                        return res.redirect('/');
                }
                var sqlUserId = mysql.format("SELECT pw,salt FROM passwords WHERE userid=?", [userid]);
                con.query(sqlUserId, function(err, result){
                        var pw = result[0]['pw'];
                        var salt = result[0]['salt'];
                        var saltedpw = saltHashPassword(req.body.userpassword,salt);
                        if (pw == saltedpw.passwordHash) {
                                var token = authenticator.register(userid,admin);
                                res.cookie('token', token, { maxAge: 43200000 }); //12 h
                                //res.status(200).send({ auth: true, token: token })
                                var sqlToken = mysql.format("INSERT INTO token (userid, token) VALUES (?,?)", [userid,token]);
                                con.query(sqlToken, function(err, result){
                                        if (err) {
                                                console.log(err);
                                        }
                                });
                                var dateTime = require('node-datetime');
                                var dt = dateTime.create();
                                var formatted = dt.format('Y-m-d H:M:S');
                                var sqlLog = mysql.format("INSERT INTO log (userid, dt, ip) VALUES (?,?,?)", [userid,formatted,req.ip]);
                                con.query(sqlLog, function(err, result){
                                        if (err) {
                                                console.log(err);
                                        }
                                });
                                return res.redirect('/home');
                        } else {
                                //res.status(401).send({ auth: false, token: null });
                                return res.redirect('/');
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
        return res.sendFile('signup.html', {root : './'});
        //req.body.emailaddress;
        //req.body.name;
        //req.body.userpassword;
        
});

app.get('/signout', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                var sqlToken = mysql.format("DELETE FROM token WHERE userid=?", [decoded.id]);
                con.query(sqlToken, function(err, result){
                        if (err) throw err;
                });
                res.clearCookie("token");
        });
        return res.sendFile('index.html', {root : './'});
        //req.body.emailaddress;
        //req.body.name;
        //req.body.userpassword;
        
});

app.get('/usersOnline', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        var sqlToken = "SELECT user.email, user.id FROM token INNER JOIN user ON token.userid=user.id";
                        con.query(sqlToken, function(err, result){
                                if (err) throw err;
                                return res.send(result); //Temporary to see if it works.
                        });
                   //     return res.sendFile('onlineStatus.html', {root : './'});
                } else {
                        return res.send("User is not an administrator");
                }
        });
        
        //req.body.emailaddress;
        //req.body.name;
        //req.body.userpassword;
        
});

app.get('/onlinestatus', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        return res.sendFile('onlinestatus.html', {root : './'});
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.get('/log', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        var sqlToken = "SELECT userid,dt,ip FROM log";;
                        con.query(sqlToken, function(err, result){
                                if (err) throw err;
                                return res.send(result); //Temporary to see if it works.
                        });
                   //     return res.sendFile('onlineStatus.html', {root : './'});
                }
        });
});

app.get('/userpage', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                        if(decoded.admin == '1'){
                                return res.sendFile('useradmin.html', {root : './'});
                        }
                        else{
                                return res.sendFile('user.html', {root : './'});
                        }
                

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
                                        return res.redirect('/home');
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
                var sqlSignup = mysql.format("INSERT INTO user (name,email,admin) VALUES (?,?,?)", [req.body.name,req.body.emailaddress,false]);
                con.query(sqlSignup, function(err,result) {
                        if (err){
                                return res.send("A user with that email already exists: (sql error)");
                        } else {
                                var sqlUserId = mysql.format("SELECT id FROM user WHERE name=? AND email=?", [req.body.name,req.body.emailaddress]);
                                con.query(sqlUserId, function(err,result) {
                                        var userid = result[0]['id'];
                                        var saltedpw = HashPassword(req.body.userpassword);
                                        var sqlPassword = mysql.format("INSERT INTO passwords (userid,pw,salt) VALUES (?,?,?)", [userid, saltedpw.passwordHash, saltedpw.salt]);
                                        con.query(sqlPassword, function(err, result) {
                                                if (err) throw err;
                                                return res.redirect('/');   
                                        });
                                });
                        }
                });
        } else {
                res.send("Captcha was incorrect");
        }
        
});

app.get('/createadmin', (req, res) => {
        console.log(req.body.usercaptcha); //test captcha
        console.log(req.body.p2); 
        var sqlSignup = mysql.format("INSERT INTO user (name,email,admin) VALUES (?,?,?)", ['sysadmin','sysadmin@miri',true]);
        con.query(sqlSignup, function(err,result) {
                if (err){
                        return res.send('Admin already exists');
                } else {
                        var sqlUserId = mysql.format("SELECT id FROM user WHERE name=? AND email=?", ['sysadmin','sysadmin@miri']);
                        con.query(sqlUserId, function(err,result) {
                                var userid = result[0]['id'];
                                var saltedpw = HashPassword('sysadmin');
                                var sqlPassword = mysql.format("INSERT INTO passwords (userid,pw,salt) VALUES (?,?,?)", [userid, saltedpw.passwordHash, saltedpw.salt]);
                                con.query(sqlPassword, function(err, result) {
                                        if (err) throw err;
                                        return res.send('Admin was created');  
                                });
                        });
                }
        });
});

app.get('/deleteusers', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        return res.sendFile('deleteusers.html', {root : './'});
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.get('/viewusers', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        return res.sendFile('viewusers.html', {root : './'});
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.get('/blockusers', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        return res.sendFile('blockusers.html', {root : './'});
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.post('/blockusers', function(req, res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        var timeblocked = 0;
                        var d = new Date();
                        var inp = req.body.userid;
                        var secondsblock = req.body.block;
                        var currenttime = d.getTime()/1000;
                        if(secondsblock < 10){
                                secondsblock = 10;
                        }
                        else if(secondsblock > 100){
                                secondsblock = 100;
                        }
                        secondsblock = d.getTime()/1000+secondsblock;

                        // Connect to server
                        var io = require('socket.io-client');
                        var socket = io.connect('http://localhost:'+apiconfig.port+'/', {reconnect: true});
                        socket.on('response', function (message) { 
                                //Send data to api containing new settings user set.
                                socket.emit('/api/checkblock',{id: inp}); //Send settings to api.
                                console.log(message);
                        });
                        
                        socket.on('/api/checkblock', function (message) {
                                //socket.emit('api/users');
                                console.log(message);
                                timeblocked = BigInt(message.response[0].dt);

                                if (timeblocked == -1) {
                                        return res.redirect('/blockusers')
                                } else if (timeblocked <= currenttime) {
        
                                        socket.on('response', function (message) { 
                                                //Send data to api containing new settings user set.
                                                socket.emit('/api/blockusers',{id: inp, secondsblock: secondsblock}); //Send settings to api.
                                                console.log(message);
                                        });
                                        
                                        socket.on('/api/blockedusers', function (message) {
                                                //socket.emit('api/users');
                                                console.log(message);
                                                return res.redirect('/blockusers');
                                        });
                                        //       socket.close();
                                }
                                else{
                                        return res.send('User with id: '+inp+" is already blocked and it is "+(timeblocked-currenttime)+" seconds left");     
                                }
                                return res.sendFile('blockusers.html', {root : './'});
                        });   
                                        //     return res.send(results);
                } else {
                        return res.send("User is not an administrator");
                }
        });
});


app.get('/usersinfo', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        var sqlToken = "SELECT user.email, user.id FROM user";
                        con.query(sqlToken, function(err, result){
                                if (err) throw err;
                                console.log(result)
                                return res.send(result); //Temporary to see if it works.
                        });
                } else {
                        return res.send("User is not an administrator");
                }
        });
        
});

app.post('/deleteusers', function(req, res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        var inp = req.body.userid;
                        var sqlDelete = mysql.format("SELECT user.id FROM user WHERE id=?", [inp]);
                        con.query(sqlDelete, (err, results) => {
                                if (err) {
                                        console.log(err);
                                } else {                                       
                                        var d = new Date();
                                        var time = d.getTime().toString();
                                        //creating a unique hash
                                        var hash = HashPassword(time);
                                        var dummyEmail = hash.passwordHash+"@deleted"
                                        console.log(dummyEmail)
                                        var dummyName = "deleted";
                                        var sqldummydata = mysql.format("UPDATE user SET email=?, name=? WHERE id=?", [dummyEmail, dummyName, inp]);
                                        //should delete token if the user is online?
                                        con.query(sqldummydata, (err, results) => {
                                                if (err) {
                                                        console.log(err);
                                                } else {
                                                   //     return res.send(results);
                                                }
                                        });
                                        return res.sendFile('deleteusers.html', {root : './'});
                                }
                        });
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.get('/blackout', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        return res.sendFile('blackout.html', {root : './'});
                } else {
                        return res.send("User is not an administrator");
                }
        });
        
});

app.get('/purgelogin', (req, res) => { //Added so we can remove login tokens from db.
        var sqlPurge = "DELETE FROM token";
        con.query(sqlPurge, function(err,result) {
                if (err) {
                        console.log(err);
                } else {
                        return res.send('Tokens were removed!');
                }
        });
});

app.get('/changepassword', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                return res.sendFile('changepassword.html', {root : './'});
        });
});

app.post('/changepassword', function(req, res) {
        var token = req.cookies.token;
        var newpassword = req.body.newpassword;
        var newpassword2 = req.body.newpassword2;
        if(newpassword != newpassword2){
                return res.send("You wrote two different passwords as newpassword")
        }
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                var userid = decoded.id;
                var sqlUserId = mysql.format("SELECT pw,salt FROM passwords WHERE userid=?", [userid]);
                con.query(sqlUserId, function(err, result){
                        var pw = result[0]['pw'];
                        var salt = result[0]['salt'];
                        var saltedpw = saltHashPassword(req.body.currentpassword,salt);
                        if (pw == saltedpw.passwordHash) {
                                saltedpw = HashPassword(req.body.newpassword);
                                pw = saltedpw.passwordHash;
                                salt = saltedpw.salt;
                                var sqlToken = mysql.format("UPDATE passwords SET salt=?, pw=? WHERE userid=?", [salt, pw, userid]);
                                con.query(sqlToken, function(err, result){
                                        if (err) {
                                                console.log(err);
                                        }
                                        else{
                                                console.log("Password changed");
                                                return res.redirect('/'); 
                                        }
                                });
                        } else {
                                return res.send("Current password was wrong");
                        }
                });     
        });
});

app.get('/settings', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                return res.sendFile('settings.html', {root : './'});
        });
});

app.post('/settings', function(req, res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                var ratiokeep = req.body.ratiokeep;
                var ratiosell = req.body.ratiosell;
                var sqlSettingsCount = mysql.format("SELECT COUNT(userid) FROM simulationsettings WHERE userid=?", [decoded.id]);
                con.query(sqlSettingsCount, (err, results) => {
                        if (err) {
                                console.log(err);
                        } else {
                                var count = parseInt(JSON.stringify(results[0]['COUNT(userid)']));
                                if (count == 0) {
                                        var sqlSettings = mysql.format("INSERT INTO simulationsettings (userid, ratiokeep, ratiosell) VALUES (?,?,?)", [decoded.id,ratiokeep,ratiosell]);
                                        con.query(sqlSettings, (err, results) => {
                                                if (err) {
                                                        console.log(err);
                                                }
                                        });
                                } else {
                                        var sqlSettings = mysql.format("UPDATE simulationsettings SET ratiokeep=?,ratiosell=? WHERE userid=?", [ratiokeep,ratiosell,decoded.id]);
                                        con.query(sqlSettings, (err, results) => {
                                                if (err) {
                                                        console.log(err);
                                                }
                                        });
                                }
                        }
                });
                // Connect to server
                var io = require('socket.io-client');
                var socket = io.connect('http://localhost:'+apiconfig.port+'/', {reconnect: true});

                socket.on('response', function (message) { 
                        //Send data to api containing new settings user set.
                        socket.emit('/api/settings',{id: decoded.id, ratiokeep: ratiokeep, ratiosell: ratiosell}); //Send settings to api.
                        console.log(message);
                });
                
                socket.on('/api/settings', function (message) {
                        //socket.emit('api/users');
                        console.log(message);
                        return res.redirect('/');
                });
        });
});

app.get('/powersettings', (req,res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        return res.sendFile('powersettings.html', {root : './'});
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.post('/powersettings', function(req,res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {

                        var high = req.body.powerCostHigh;
                        var low = req.body.powerCostLow;

                        var io = require('socket.io-client');
                        var socket = io.connect('http://localhost:'+apiconfig.port+'/', {reconnect: true});

                        socket.on('response', function (message) { 
                                //Send data to api containing new settings user set.
                                socket.emit('/api/powersettings',{id: decoded.id, powerCostHigh: high, powerCostLow: low}); //Send settings to api.
                                console.log(message);
                        });
                        
                        socket.on('/api/powersettings', function (message) {
                                //socket.emit('api/users');
                                console.log(message);
                                return res.redirect('/');
                        });

                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.post('/plantsettings', function(req, res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                if (decoded.admin == '1') {
                        var ratiokeep = req.body.ratiokeep;
                        // Connect to server
                        var io = require('socket.io-client');
                        var socket = io.connect('http://localhost:'+apiconfig.port+'/', {reconnect: true});

                        socket.on('response', function (message) { 
                                //Send data to api containing new settings user set.
                                socket.emit('/api/plantsettings',{id: decoded.id, ratiokeep: ratiokeep}); //Send settings to api.
                                console.log(message);
                        });
                        
                        socket.on('/api/plantsettings', function (message) {
                                //socket.emit('api/users');
                                console.log(message);
                                return res.redirect('/');
                        });
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.post('/planton', function(req, res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                if (decoded.admin == '1') {
                        // Connect to server
                        var io = require('socket.io-client');
                        var socket = io.connect('http://localhost:'+apiconfig.port+'/', {reconnect: true});

                        socket.on('response', function (message) { 
                                //Send data to api containing new settings user set.
                                socket.emit('/api/planton',{id: decoded.id}); //Send settings to api.
                                console.log(message);
                        });
                        
                        socket.on('/api/planton', function (message) {
                                //socket.emit('api/users');
                                console.log(message);
                                return res.redirect('/');
                        });
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.post('/plantoff', function(req, res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                if (decoded.admin == '1') {
                        // Connect to server
                        var io = require('socket.io-client');
                        var socket = io.connect('http://localhost:'+apiconfig.port+'/', {reconnect: true});

                        socket.on('response', function (message) { 
                                //Send data to api containing new settings user set.
                                socket.emit('/api/plantoff',{id: decoded.id}); //Send settings to api.
                                console.log(message);
                        });
                        
                        socket.on('/api/plantoff', function (message) {
                                //socket.emit('api/users');
                                console.log(message);
                                return res.redirect('/');
                        });
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

app.post('/plantpower', function(req, res) {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                if (decoded.admin == '1') {
                        var power = req.body.power;
                        // Connect to server
                        var io = require('socket.io-client');
                        var socket = io.connect('http://localhost:'+apiconfig.port+'/', {reconnect: true});

                        socket.on('response', function (message) { 
                                //Send data to api containing new settings user set.
                                socket.emit('/api/plantpower',{id: decoded.id, power: power}); //Send settings to api.
                                console.log(message);
                        });
                        
                        socket.on('/api/plantpower', function (message) {
                                //socket.emit('api/users');
                                console.log(message);
                                return res.redirect('/');
                        });
                } else {
                        return res.send("User is not an administrator");
                }
        });
});

//Create similar one for admin that takes an userid as input through the post/get that connects to API. Use this to display a special web page
//with iframe that calls admin passthough to api.
app.get('/api/:inp', (req, res) => {
        console.log("start '/api/:inp");
        console.log(req.params.inp);
        console.log('/api/'+req.params.inp);
        var token = req.cookies.token;
        var inp = '/api/'+req.params.inp;
        if (!token) {
                console.log("Token failed, is missing!");
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) {
                        console.log("Failed to verify!");
                        return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                }
                
                //res.status(200).send(decoded);
                // Connect to server
                var io = require('socket.io-client');
                var socket = io.connect('http://localhost:'+apiconfig.port+'/');

                // socket.on('testServer', function (message) {
                //         socket.emit('/api/test', {data: 'asd'});
                //         console.log(message);
                // });

                // socket.on('testServer2', function (message) {
                //         console.log(message);
                // });

                socket.on('response', function (message) { 
                        console.log("before socket.emit,  req.params.inp = "+req.params.inp+"  id: decoded.id = "+decoded.id);
                        console.log("after first emit");
                        console.log(message);
                        socket.emit(inp, {id: decoded.id}); //Send id to api.
                });
                
                socket.on(inp, function (message) {
                        //socket.emit('api/users');
                        console.log(message);
                        return res.send(message);
                });
                
        });
});

app.post('/fetchuser', (req, res) => {
        var token = req.cookies.token;
        var userid = req.body.userid;
        if (!token) {
                console.log("Token failed, is missing!");
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) {
                        console.log("Failed to verify!");
                        return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                }

                if (decoded.admin == '1') {
                        // Connect to server
                        var io = require('socket.io-client');
                        var socket = io.connect('http://localhost:'+apiconfig.port+'/');

                        socket.on('response', function (message) { 
                                console.log(message);
                                socket.emit('/api/user', {id: userid}); //Send id to api.
                        });
                        
                        socket.on('/api/user', function (message) {
                                console.log(message);
                                var user = JSON.parse(message);
                                message = user.response[0].value;
                                return res.send(message);
                        });
                        
                } else {
                        return res.send('User is not an administrator');
                }
        });
}); 

app.get('/profile', (req, res) => {
        var token = req.cookies.token;
        if (!token) {
                return res.status(401).end()
        }
        jwt.verify(token, authenticator.secret, function(err, decoded) {
                if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
                
                //res.status(200).send(decoded);
                return res.sendFile('profile.html', {root : './'});
        });
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
                console.log("Decoded admin"+decoded.admin);
                if (decoded.admin == '1') {
                        return res.sendFile('homeadmin.html', {root : './'});
                } else {
                        return res.sendFile('home.html', {root : './'});
                }
        });
        
        //return res.status(token.id).end();
        
});

//https.createServer(options, function (req, res) {
//      res.writeHead(200);
//      res.end("hello");
//}).listen(3000);

var temp = https.createServer(options, app).listen(config.port);

// Connect to server
var io = require('socket.io')(temp);

//check if someone logged in
io.on('connection', function(socket){
        console.log('a user connected');
        socket.on('chat message', function(msg){
                console.log('message: ' + msg);
        });
        var srvSockets = io.sockets.sockets;
        console.log(Object.keys(srvSockets).length);
        socket.on('disconnect', function(){
                console.log('user disconnected');
        });
});
//var ioTest = require('socket.io').listen(temp)



