const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
 
var apartmentPower = 300; //Average power used by an apartment.
var housePower = 2500; //Average power used by house.
var	tempMinAffect = 25; //At this value no power goes to heat.
var	tempMaxAffect = -30; //At this value maximum power goes to heat.
var	tempAffect = 2; //Maximum affect temperature has.
var	tempCoefficient = 0.6; //Procentage that is affected by temperature.
var	powerCostHigh = 0.01; //Cost if powerplant
var	powerCostLow = 0.005; //Cost if wind
var http = require('http');
//var io = require('socket.io');

// parse application/json
app.use(bodyParser.json());

 
//create database connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'miri'
});
 
//connect to database
conn.connect((err) =>{
    if(err) throw err;
    console.log('Mysql Connected...');
});
 
// //show all users
// app.get('/api/users',(req, res) => {
//     let sql = "SELECT household.id,household.locationid,household.housetype,powerusage.value,powergenerated.value FROM household INNER JOIN powerusage ON household.id=powerusage.householdid INNER JOIN powergenerated ON household.id=powergenerated.householdid";
//     let query = conn.query(sql, (err, results) => {
//         if(err) throw err;
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     });
// });
 
// //show single user
// app.get('/api/users/:id',(req, res) => {
//     let sql = "SELECT household.id,household.locationid,household.housetype,powerusage.value,powergenerated.value FROM household INNER JOIN powerusage ON household.id=powerusage.householdid INNER JOIN powergenerated ON household.id=powergenerated.householdid WHERE household.id="+req.params.id;
//     let query = conn.query(sql, (err, results) => {
//         if(err) throw err;
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     });
// });

// //show windspeed & temperature
// app.get('/api/weather',(req, res) => {
//     let sql = "SELECT temperature.temperature, windspeed.windspeed, temperature.datetimeid FROM temperature INNER JOIN windspeed ON temperature.datetimeid=windspeed.locationid";
//     let query = conn.query(sql, (err, results) => {
//         if(err) throw err;
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     });
// });
 
// //show current electricity price
// app.get('/api/electricityprice',(req, res) => {
//     let sql = "SELECT householdid, value, datetimeid FROM powercosthousehold";
//     let query = conn.query(sql, (err, results) => {
//         if(err) throw err;
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     });
// });

// //show current electricity price type 2
// app.get('/api/electricityprice2',(req, res) => {
//     let sql = "SELECT COUNT(id) FROM household";
//     let query = conn.query(sql, (err, results) => {
//         if(err) throw err;
//         let totalhouseholds = parseInt(JSON.stringify(results[0]['COUNT(id)']));
//         let sql = "SELECT powerin,powerout FROM powertotal ORDER BY datetimeid DESC LIMIT 1";
//         let query = conn.query(sql, (err, results) => {
//             let powerin = parseFloat(JSON.stringify(result[0]['powerin']));
//             let powerout = parseFloat(JSON.stringify(result[0]['powerout']));
//             let powercost = 0;
//             if (powerin <= powerout) {
//                 powercost = powerCostHigh;    
//             } else {
//                 powercost = powerCostLow;
//             }
//         });
//         res.send(JSON.stringify({"status": 200, "error": null, "response": powercost}));
//     });
// });

// //shows current electricity consumtion.
// app.get('/api/electricityconsumtion',(req, res) => {
//     let sql = "SELECT powerout, datetimeid FROM powertotal";
//     let query = conn.query(sql, (err, results) => {
//         if(err) throw err;
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     });
// });
  
// //add new product
// app.post('/api/products',(req, res) => {
//     let data = {product_name: req.body.product_name, product_price: req.body.product_price};
//     let sql = "INSERT INTO product SET ?";
//     let query = conn.query(sql, data,(err, results) => {
//         if(err) throw err;
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     });
// });
 
// //update product
// app.put('/api/products/:id',(req, res) => {
//     let sql = "UPDATE product SET product_name='"+req.body.product_name+"', product_price='"+req.body.product_price+"' WHERE product_id="+req.params.id;
//     let query = conn.query(sql, (err, results) => {
//         if(err) throw err;
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     });
// });
 
// //Delete product
// app.delete('/api/products/:id',(req, res) => {
//     let sql = "DELETE FROM product WHERE product_id="+req.params.id+"";
//     let query = conn.query(sql, (err, results) => {
//         if(err) throw err;
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     });
// });
 
// //Server listening
// app.listen(8080,() =>{
//     console.log('Server started on port 8080...');
// });
// Create server & socket
// var server = http.createServer(function(req, res)
// {
//   // Send HTML headers and message
//   res.writeHead(404, {'Content-Type': 'text/html'});
//   res.end('<h1>Aw, snap! 404</h1>');
// });
// server.listen(8080);
// io.listen(server);

var io = require('socket.io').listen(8080);

// Add a connect listener
io.sockets.on('connect', function(socket)
{
    console.log('Client connected.');
    socket.emit('response', {response: "Connected to API"});
 //   socket.send("Hello, test 123");
    //socket.emit('testServer', {data: 'Hello, its working'});

    socket.on('/api/test', function(data) {
        console.log("test");
        socket.emit('testServer2', {data: 'Hello, its working'});
    });

    //show all users
    socket.on('/api/users', function(data) {
        let sql = "SELECT household.id,household.locationid,household.housetype,powerusage.value,powergenerated.value FROM household INNER JOIN powerusage ON household.id=powerusage.householdid INNER JOIN powergenerated ON household.id=powergenerated.householdid";
        let query = conn.query(sql, (err, results) => {
            if(err) {
                console.log(err);
            }
            socket.emit('/api/users',JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });
    
    //show single user
    socket.on('/api/user', function(data) {
        var id = data.id;
        let sql = mysql.format("SELECT household.id,household.locationid,household.housetype,powerusage.value,powergenerated.value FROM household INNER JOIN powerusage ON household.id=powerusage.householdid INNER JOIN powergenerated ON household.id=powergenerated.householdid WHERE household.id=?", [id]);
        let query = conn.query(sql, (err, results) => {
            if(err) throw err;
            socket.emit('/api/user', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });

    //show windspeed & temperature
    socket.on('/api/weather', function(data) {
        console.log("Entered weather");
        let sql = "SELECT temperature.temperature, windspeed.windspeed, temperature.datetimeid FROM temperature INNER JOIN windspeed ON temperature.datetimeid=windspeed.datetimeid";
        let query = conn.query(sql, (err, results) => {
            if(err) throw err;
            console.log("Emit");
            socket.emit('/api/weather', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });
    
    //show current electricity price
    socket.on('/api/electricityprice', function(data) {
        let sql = "SELECT householdid, value, datetimeid FROM powercosthousehold";
        let query = conn.query(sql, (err, results) => {
            if(err) throw err;
            socket.emit('/api/electricityprice', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });

    //show current electricity price type 2
    socket.on('/api/electricityprice2', function(data) {
        let sql = "SELECT COUNT(id) FROM household";
        let query = conn.query(sql, (err, results) => {
            if(err) throw err;
            let totalhouseholds = parseInt(JSON.stringify(results[0]['COUNT(id)']));
            let sql = "SELECT powerin,powerout FROM powertotal ORDER BY datetimeid DESC LIMIT 1";
            let query = conn.query(sql, (err, results) => {
                let powerin = parseFloat(JSON.stringify(result[0]['powerin']));
                let powerout = parseFloat(JSON.stringify(result[0]['powerout']));
                let powercost = 0;
                if (powerin <= powerout) {
                    powercost = powerCostHigh;    
                } else {
                    powercost = powerCostLow;
                }
            });
            socket.emit('/api/eletricityprice2', JSON.stringify({"status": 200, "error": null, "response": powercost}));
        });
    });

    //shows current electricity consumtion.
    socket.on('/api/electricityconsumtion', function(data) {
        let sql = "SELECT powerout, datetimeid FROM powertotal";
        let query = conn.query(sql, (err, results) => {
            if(err) throw err;
            socket.emit('/api/electricityconsumtion', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });

    //Creates user
    socket.on('/api/createuser', function(data) {
        console.log(data);
        var locationid = -1;
        var sqlLocation = mysql.format("SELECT COUNT(id) FROM location WHERE name=?",[data.location]);
        conn.query(sqlLocation, (err, results) => {
            var count = parseInt(results[0]['COUNT(id)']);
            if (count == 0) {
                var sqlCreateLocation = mysql.format("INSERT INTO location (name) VALUES (?)", [data.location]);
                conn.query(sqlCreateLocation, (err, results) => {
                    if (err) throw err;
                    var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?",[data.location]);
                    conn.query(sqlLocation, (err, results) => {
                        if (err) throw err;
                        locationid = results[0]['id'];
                        var sqlNewHousehold = mysql.format('INSERT INTO household (locationid,housetype) VALUES (?,?)',[locationid,data.housetype]);
                        conn.query(sqlNewHousehold, (err, results) => {
                            if (err) throw err;
                            var sqlHouseholdId = "SELECT LAST_INSERT_ID()";
                            conn.query(sqlHouseholdId, function(err, results) {
                                if (err) throw err;
                                var householdid = results[0]['LAST_INSERT_ID()'];
                                var sqlNewUser = mysql.format("INSERT INTRO user (id, householdid) VALUES (?,?)", [data.id, householdid]);
                                conn.query(sqlNewUser, function(err, results) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        socket.emit('api/createuser', JSON.stringify({"status": 200, "error": null, "response": results}));
                                    }
                                })
                            });
                        });
                    });
                });
            } else {
                var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?",[data.location]);
                conn.query(sqlLocation, (err, results) => {
                    if (err) throw err;
                    locationid = results[0]['id'];
                    var sqlNewHousehold = mysql.format('INSERT INTO household (locationid,housetype) VALUES (?,?)',[locationid,data.housetype]);
                    conn.query(sqlNewHousehold, (err, results) => {
                        if (err) throw err;
                        var sqlHouseholdId = "SELECT LAST_INSERT_ID()";
                        conn.query(sqlHouseholdId, function(err, results) {
                            if (err) throw err;
                            var householdid = results[0]['LAST_INSERT_ID()'];
                            var sqlNewUser = mysql.format("INSERT INTRO user (id, householdid) VALUES (?,?)", [data.id, householdid]);
                            conn.query(sqlNewUser, function(err, results) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    socket.emit('api/createuser', JSON.stringify({"status": 200, "error": null, "response": results}));
                                }
                            })
                        });
                    });
                });
            }
        });
    });

    socket.on('/api/buffer', function(data) {
        var id = data.id;
        var sqlBuffer = mysql.format("SELECT value FROM poweredstored WHERE householdid=?", [id]);
        conn.query(sqlBuffer, (err, results) => {
            if (err) {
                console.log(err);
            } else {
                return socket.emit('/api/buffer', JSON.stringify({"status": 200, "error": null, "response": results}));
            }
        });
    });

    socket.on('/api/checkblock', function(data) {
        var id = data.id;
        var sqlBanned = mysql.format("SELECT COUNT(dt) FROM blockedhouseholds INNER JOIN user ON blockedhouseholds.householdid=user.householdid WHERE user.id=?", [id]);
        con.query(sqlBanned, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                var num = parseInt(results[0]['COUNT(dt)']);
                if (num != 0) {
                    var sqlBanned = mysql.format("SELECT dt FROM blockedhouseholds INNER JOIN user ON blockedhouseholds.householdid=user.householdid WHERE user.id=?", [id]);
                    con.query(sqlBanned, function(err, results) {
                        if (err) {
                            console.log(err);
                        }
                        return socket.emit('/api/checkblock', JSON.stringify({"status": 200, "error": null, "response": results}));
                    });
                } else {
                    return socket.emit('/api/checkblock', JSON.stringify({"status": 200, "error": null, "response": 'dt: 0'}));
                }
            }
        });
    });

    socket.on('/api/blockusers', function(data) {
        //res.status(200).send(decoded);
        console.log("id "+data.id);
        var d = new Date();
        var inp = data.id;
        var secondsblock = data.secondsblock;

        var sqlsettime = mysql.format("INSERT INTO blockedhousehold (householdid, dt) VALUES (SELECT householdid FROM user WHERE id=?,?)", [inp, secondsblock]);
        con.query(sqlPassword, function(err, results) {
            if (err) throw err;
            return socket.emit('/api/blockusers', JSON.stringify({"status": 200, "error": null, "response": results}));
        });   

    });

    socket.on('/api/settings', function(data) {
        var id = data.id;
        var ratiokeep = data.ratiokeep;
        var ratiosell = data.ratiosell;
        var sqlSettingsCount = mysql.format("SELECT COUNT(userid) FROM simulationsettings WHERE userid=?", [id]);
        conn.query(sqlSettingsCount, (err, results) => {
            if (err) {
                console.log(err);
            } else {
                var count = parseInt(JSON.stringify(results[0]['COUNT(userid)']));
                if (count == 0) {
                    var sqlSettings = mysql.format("INSERT INTO simulationsettings (userid, ratiokeep, ratiosell) VALUES (?,?,?)", [id,ratiokeep,ratiosell]);
                    conn.query(sqlSettings, (err, results) => {
                        if (err) {
                            console.log(err);
                        } else {
                            return socket.emit('/api/settings', JSON.stringify({"status": 200, "error": null, "response": results}));
                        }
                    });
                } else {
                    var sqlSettings = mysql.format("UPDATE simulationsettings SET ratiokeep=?,ratiosell=? WHERE userid=?", [ratiokeep,ratiosell,id]);
                    conn.query(sqlSettings, (err, results) => {
                        if (err) {
                            console.log(err);
                        } else {
                            return socket.emit('/api/settings', JSON.stringify({"status": 200, "error": null, "response": results}));
                        }
                    });
                }
            }
        });
    });

    // Disconnect listener
    socket.on('disconnect', function() {
        console.log('Client disconnected.');
    });
});

//http://35.173.230.193:3000/api/electricityconsumtion