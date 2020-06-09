const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
var config = require("../config/apiconfig");
var simconfig = require("../config/simulatorconfig");
var http = require('http');
//var io = require('socket.io');

// parse application/json
app.use(bodyParser.json());

var apartmentPower = simconfig.simulatorvar.apartmentPower; //Average power used by an apartment.
var housePower = simconfig.simulatorvar.housePower; //Average power used by house.
var	tempMinAffect = simconfig.simulatorvar.tempMinAffect; //At this value no power goes to heat.
var	tempMaxAffect = simconfig.simulatorvar.tempMaxAffect; //At this value maximum power goes to heat.
var	tempAffect = simconfig.simulatorvar.tempAffect; //Maximum affect temperature has.
var	tempCoefficient = simconfig.simulatorvar.tempCoefficient; //Procentage that is affected by temperature.
var	powerCostHigh = simconfig.simulatorvar.powerCostHigh; //Cost if powerplant
var	powerCostLow = simconfig.simulatorvar.powerCostLow; //Cost if wind
 
//create database connection
const conn = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
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

var io = require('socket.io').listen(config.port);

// Add a connect listener
io.sockets.on('connect', function(socket)
{
    console.log('Client connected.');
    socket.emit('response', {response: "Connected to API"});
 //   socket.send("Hello, test 123");
    //socket.emit('testServer', {data: 'Hello, its working'});

    socket.on('/api/test', function(data) {
        console.log("test");
        return socket.emit('testServer2', {data: 'Hello, its working'});
    });

    //show all users
    socket.on('/api/users', function(data) {
        var sql = "SELECT household.id,household.locationid,household.housetype,powerusage.value,powergenerated.value FROM household INNER JOIN powerusage ON household.id=powerusage.householdid INNER JOIN powergenerated ON household.id=powergenerated.householdid";
        conn.query(sql, (err, results) => {
            if(err) {
                console.log(err);
            }
            return socket.emit('/api/users',JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });
    
    //show single user
    socket.on('/api/user', function(data) {
        var id = data.id;
        var sql = mysql.format("SELECT household.id,household.locationid,household.housetype,powerusage.value FROM household INNER JOIN powerusage ON household.id=powerusage.householdid WHERE household.id=? ORDER BY id DESC LIMIT 1", [id]);
        //order by datetimeid fungerar inte i queryn ovanför, bytte till bara id, bör förmodligen vara datetimeid i SELECT
        conn.query(sql, (err, results) => {
            if(err) throw err;
            return socket.emit('/api/user', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });


    //show powergenerated
    socket.on('/api/powergenerated', function(data) {
        var id = data.id;
        var sql = mysql.format("SELECT powergenerated.value FROM powergenerated WHERE householdid=? ORDER BY householdid DESC LIMIT 1",[id]);
        //order by datetimeid fungerar inte i queryn ovanför, bytte till bara id, bör förmodligen vara datetimeid i SELECT
        conn.query(sql, (err, results) => {
            if(err) throw err;
            return socket.emit('/api/powergenerated', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });

    //show windspeed & temperature
    socket.on('/api/weather', function(data) {
        console.log("Entered weather");
        var sql = "SELECT temperature.temperature, windspeed.windspeed, temperature.datetimeid FROM temperature INNER JOIN windspeed ON temperature.datetimeid=windspeed.datetimeid ORDER BY datetimeid DESC LIMIT 1";
        conn.query(sql, (err, results) => {
            if(err) throw err;
            console.log("Emit");
            return socket.emit('/api/weather', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });
    
    //show current electricity price type 1
    socket.on('/api/electricityprice', function(data) {
        console.log("electricityprice")
        var sql = "SELECT COUNT(id) FROM household";
        conn.query(sql, (err, results) => {
            if(err) throw err;
            var totalhouseholds = parseInt(JSON.stringify(results[0]['COUNT(id)']));
            var powercost = 0;
            var sqlPower = "SELECT powerin,powerout FROM powertotal ORDER BY i DESC LIMIT 1";
            conn.query(sqlPower, (err, results) => {
                if(err) throw err;
                var powerin = parseFloat(JSON.stringify(results[0]['powerin']));
                var powerout = parseFloat(JSON.stringify(results[0]['powerout']));
                
                if (powerin <= powerout) {
                    powercost = powerCostHigh;    
                } else {
                    powercost = powerCostLow;
                }
                return socket.emit('/api/electricityprice', JSON.stringify({"status": 200, "error": null, "response": {result: powercost}}));
            });
            
        });
    });

    //show current electricity price type 2
    socket.on('/api/electricityprice2', function(data) {
        console.log("electricityprice2")
        var id = data.id;
        var sql = "SELECT COUNT(id) FROM household";
        conn.query(sql, (err, results) => {
            if(err) throw err;
            var totalhouseholds = parseInt(JSON.stringify(results[0]['COUNT(id)']));
            var powercost = 0;
            var sqlPower = "SELECT powerin,powerout FROM powertotal ORDER BY i DESC LIMIT 1";
            conn.query(sqlPower, (err, results) => {
                if(err) throw err;
                var powerin = parseFloat(JSON.stringify(results[0]['powerin']));
                var powerout = parseFloat(JSON.stringify(results[0]['powerout']));
                var sqlPriceAndPowerFromPlant = mysql.format("SELECT powerplantsettings.powerCostHigh, powerplantsettings.powerCostLow, powerplant.maxpower FROM powerplantsettings INNER JOIN powerplant ON powerplantsettings.powerplantid=powerplant.id INNER JOIN household ON powerplant.locationid=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?", [id]);
                conn.query(sqlPriceAndPowerFromPlant, (err, results) => {
                    if(err) throw err;
                    var high = parseFloat(JSON.stringify(results[0]['powerCostHigh']));
                    var low = parseFloat(JSON.stringify(results[0]['powerCostLow']));
                    var max = parseFloat(JSON.stringify(results[0]['maxpower']));
                    if (powerin > powerout) {
                        powercost = (low * (powerin-powerout) + high*max)/((powerin-powerout)*max);   
                    } else {
                        powercost = high;
                    }
                    return socket.emit('/api/electricityprice2', JSON.stringify({"status": 200, "error": null, "response": {result: powercost}}));
                });
            });
            
        });
    });

    //shows current electricity consumtion.
    socket.on('/api/electricityconsumtion', function(data) {
        var sql = "SELECT powerout, datetimeid FROM powertotal";
        conn.query(sql, (err, results) => {
            if(err) throw err;
            return socket.emit('/api/electricityconsumtion', JSON.stringify({"status": 200, "error": null, "response": results}));
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
                                        return socket.emit('api/createuser', JSON.stringify({"status": 200, "error": null, "response": results}));
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
                                    return socket.emit('api/createuser', JSON.stringify({"status": 200, "error": null, "response": results}));
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
        var sqlBuffer = mysql.format("SELECT value FROM powerstored INNER JOIN user ON powerstored.householdid=user.householdid WHERE user.id=?", [id]);
        conn.query(sqlBuffer, (err, results) => {
            if (err) throw err;
            return socket.emit('/api/buffer', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });

    socket.on('/api/checkblock', function(data) {
        var id = data.id;
        var sqlBanned = mysql.format("SELECT COUNT(dt) FROM blockedhousehold INNER JOIN user ON blockedhousehold.householdid=user.householdid WHERE user.id=?", [id]);
        conn.query(sqlBanned, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                var num = parseInt(results[0]['COUNT(dt)']);
                if (num != 0) {
                    var sqlBanned = mysql.format("SELECT dt FROM blockedhousehold INNER JOIN user ON blockedhousehold.householdid=user.householdid WHERE user.id=?", [id]);
                    conn.query(sqlBanned, function(err, results) {
                        if (err) {
                            console.log(err);
                        }
                        return socket.emit('/api/checkblock', JSON.stringify({"status": 200, "error": null, "response": results}));
                    });
                } else {
                    return socket.emit('/api/checkblock', JSON.stringify({"status": 200, "error": null, "response": [{dt: -1}]}));
                }
            }
        });
    });

    socket.on('/api/blockusers', function(data) {
        //res.status(200).send(decoded);
        console.log("id "+data.id);
        var id = data.id;
        var secondsblock = data.secondsblock;

        var sqlHouseholdId = mysql.format("SELECT householdid FROM user WHERE id=?", [id]);
        conn.query(sqlHouseholdId, function(err, results) {
            if (err) throw err;
            var householdid = results[0]['householdid'];
            var sqlCount = mysql.format("SELECT COUNT(blockedhousehold.dt) FROM blockedhousehold INNER JOIN user ON blockedhousehold.householdid=user.householdid WHERE user.id=?", [id]);
            conn.query(sqlCount, function(err, results) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(results);
                    var num = parseInt(results[0]['COUNT(blockedhousehold.dt)']);
                    if (num == 0) {
                        var sqlsettime = mysql.format("INSERT INTO blockedhousehold (householdid, dt) VALUES (?,?)", [householdid,secondsblock]);
                        conn.query(sqlsettime, function(err, results) {
                            if (err) throw err;
                            return socket.emit('/api/blockusers', JSON.stringify({"status": 200, "error": null, "response": results}));
                        }); 
                    } else {
                        var sqlBanned = mysql.format("SELECT blockedhousehold.dt FROM blockedhousehold INNER JOIN user ON blockedhousehold.householdid=user.householdid WHERE user.id=?", [id]);
                        conn.query(sqlBanned, function(err, results) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(results);
                                var lastblocked = BigInt(results[0]['dt']);
                                if (lastblocked < secondsblock) {
                                    var sqlsettime = mysql.format("UPDATE blockedhousehold SET dt=? WHERE householdid=?", [secondsblock,householdid]);
                                    conn.query(sqlsettime, function(err, results) {
                                        if (err) throw err;
                                        return socket.emit('/api/blockusers', JSON.stringify({"status": 200, "error": null, "response": results}));
                                    }); 
                                } else {
                                    return socket.emit('/api/blockusers', JSON.stringify({"status": 200, "error": null, "response": "User is already banned for a longer time"}));
                                }
                            }
                        });
                    }
                }
            }); 
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
                        }
                        return socket.emit('/api/settings', JSON.stringify({"status": 200, "error": null, "response": results}));
                    });
                } else {
                    var sqlSettings = mysql.format("UPDATE simulationsettings SET ratiokeep=?,ratiosell=? WHERE userid=?", [ratiokeep,ratiosell,id]);
                    conn.query(sqlSettings, (err, results) => {
                        if (err) {
                            console.log(err);
                        }
                        return socket.emit('/api/settings', JSON.stringify({"status": 200, "error": null, "response": results}));
                    });
                }
            }
        });
    });

    socket.on('/api/powersettings', function(data) {
        var id = data.id;
        var high = data.powerCostHigh;
        var low = data.powerCostLow;
        var sqlSettingsCount = mysql.format("SELECT COUNT(powerplantsettings.id) FROM powerplantsettings INNER JOIN powerplant ON powerplantsettings.powerplantid=powerplant.id INNER JOIN household ON powerplant.locationid=household.locationid INNER JOIN user ON user.householdid=household.id WHERE user.id=?", [id]);
        conn.query(sqlSettingsCount, (err, results) => {
            if (err) {
                console.log(err);
            } else {
                var count = parseInt(JSON.stringify(results[0]['COUNT(powerplantsettings.id)']));
                var sqlPlantId = mysql.format("SELECT powerplant.id FROM powerplant INNER JOIN household ON powerplant.locationid=household.locationid INNER JOIN user ON user.householdid=household.id WHERE user.id=?", [id]);
                conn.query(sqlPlantId, (err, results) => {
                    if (err) {
                        console.log(err);
                    }
                    //var plantid = results[0]['powerplant.id'];
                    var plantid = results[0]['id'];
                    console.log("powerplantid "+plantid);
                    if (count == 0) {  
                        var sqlSettings = mysql.format("INSERT INTO powerplantsettings (powerplantid, powerCostHigh, powerCostLow) VALUES (?,?,?)", [plantid,high,low]);
                        conn.query(sqlSettings, (err, results) => {
                            if (err) {
                                console.log(err);
                            }
                            return socket.emit('/api/powersettings', JSON.stringify({"status": 200, "error": null, "response": results}));
                        });
                    } else {
                        var sqlSettings = mysql.format("UPDATE powerplantsettings SET powerCostHigh=?,powerCostLow=? WHERE powerplantid=?", [high,low,plantid]);
                        conn.query(sqlSettings, (err, results) => {
                            if (err) {
                                console.log(err);
                            }
                            return socket.emit('/api/powersettings', JSON.stringify({"status": 200, "error": null, "response": results}));
                        });
                    }
                });
            }
        });
    });

    socket.on('/api/plantstatus', function(data) {
        var id = data.id;
        var sqlPlant = mysql.format("SELECT powerplant.maxpower, powerplant.buffer, powerplant.ratiokeep, powerplant.status FROM powerplant INNER JOIN household ON powerplant.locationid=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?", [id]);
        conn.query(sqlPlant, function(err, results) {
            if (err) {
                console.log(err);
            }
            return socket.emit('/api/plantstatus', JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    });

    socket.on('/api/plantsettings', function(data) {
        var id = data.id;
        var ratiokeep = data.ratiokeep;
        var sqlSettingsCount = mysql.format("SELECT COUNT(powerplant.ratiokeep) FROM powerplant INNER JOIN household ON powerplant.locationid=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?", [id]);
        conn.query(sqlSettingsCount, (err, results) => {
            if (err) {
                console.log(err);
            } else {
                var count = parseInt(JSON.stringify(results[0]['COUNT(powerplant.ratiokeep)']));
                if (count == 0) {
                    return socket.emit('/api/plantsettings', JSON.stringify({"status": 200, "error": true, "response": "No power plant found"}));
                } else {
                    var sqlLocationId = mysql.format("SELECT location.id FROM location INNER JOIN household ON location.id=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?",[id]);
                    conn.query(sqlLocationId, (err, results) => {
                        if (err) {
                            console.log(err);
                        };
                        var locationid = results[0]['id'];
                        var sqlSettings = mysql.format("UPDATE powerplant SET ratiokeep=? WHERE locationid=?", [ratiokeep,locationid]);
                        conn.query(sqlSettings, (err, results) => {
                            if (err) {
                                console.log(err);
                            }
                            return socket.emit('/api/plantsettings', JSON.stringify({"status": 200, "error": null, "response": results}));
                        });
                    });
                }
            }
        });
    });

    socket.on('/api/planton', function(data) {
        console.log("ENTER PLANTON");
        var id = data.id;
        var sqlSettingsCount = mysql.format("SELECT COUNT(powerplant.ratiokeep) FROM powerplant INNER JOIN household ON powerplant.locationid=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?", [id]);
        conn.query(sqlSettingsCount, (err, results) => {
            if (err) {
                console.log(err);
            } else {
                var count = parseInt(JSON.stringify(results[0]['COUNT(powerplant.ratiokeep)']));
                if (count == 0) {
                    return socket.emit('/api/planton', JSON.stringify({"status": 200, "error": true, "response": "No power plant found"}));
                } else {
                    var sqlLocationId = mysql.format("SELECT location.id FROM location INNER JOIN household ON location.id=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?",[id]);
                    conn.query(sqlLocationId, (err, results) => {
                        if (err) {
                            console.log(err);
                        };
                        var locationid = results[0]['id'];
                        console.log("LOCATIONID  "+locationid);
                        var sqlSettings = mysql.format("UPDATE powerplant SET status='starting' WHERE locationid=?", [locationid]);
                        conn.query(sqlSettings, (err, results) => {
                            if (err) {
                                console.log(err);
                            }
                            return socket.emit('/api/planton', JSON.stringify({"status": 200, "error": null, "response": results}));
                        });
                    });
                }
            }
        });
    });

    socket.on('/api/plantoff', function(data) {
        var id = data.id;
        var sqlSettingsCount = mysql.format("SELECT COUNT(powerplant.ratiokeep) FROM powerplant INNER JOIN household ON powerplant.locationid=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?", [id]);
        conn.query(sqlSettingsCount, (err, results) => {
            if (err) {
                console.log(err);
            } else {
                var count = parseInt(JSON.stringify(results[0]['COUNT(powerplant.ratiokeep)']));
                if (count == 0) {
                    return socket.emit('/api/plantoff', JSON.stringify({"status": 200, "error": true, "response": "No power plant found"}));
                } else {
                    var sqlLocationId = mysql.format("SELECT location.id FROM location INNER JOIN household ON location.id=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?",[id]);
                    conn.query(sqlLocationId, (err, results) => {
                        if (err) {
                            console.log(err);
                        };
                        var locationid = results[0]['id'];
                        var sqlSettings = mysql.format("UPDATE powerplant SET status='stopped' WHERE locationid=?", [locationid]);
                        conn.query(sqlSettings, (err, results) => {
                            if (err) {
                                console.log(err);
                            }
                            return socket.emit('/api/plantoff', JSON.stringify({"status": 200, "error": null, "response": results}));
                        });
                    });
                }
            }
        });
    });

    socket.on('/api/plantpower', function(data) {
        var id = data.id;
        var power = data.power;
        var sqlSettingsCount = mysql.format("SELECT COUNT(powerplant.ratiokeep) FROM powerplant INNER JOIN household ON powerplant.locationid=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?", [id]);
        conn.query(sqlSettingsCount, (err, results) => {
            if (err) {
                console.log(err);
            } else {
                var count = parseInt(JSON.stringify(results[0]['COUNT(powerplant.ratiokeep)']));
                if (count == 0) {
                    return socket.emit('/api/plantpower', JSON.stringify({"status": 200, "error": true, "response": "No power plant found"}));
                } else {
                    var sqlLocationId = mysql.format("SELECT location.id FROM location INNER JOIN household ON location.id=household.locationid INNER JOIN user ON household.id=user.householdid WHERE user.id=?",[id]);
                    conn.query(sqlLocationId, (err, results) => {
                        if (err) {
                            console.log(err);
                        };
                        var locationid = results[0]['id'];
                        var sqlSettings = mysql.format("UPDATE powerplant SET maxpower=? WHERE locationid=?", [power,locationid]);
                        conn.query(sqlSettings, (err, results) => {
                            if (err) {
                                console.log(err);
                            }
                            return socket.emit('/api/plantpower', JSON.stringify({"status": 200, "error": null, "response": results}));
                        });
                    });
                }
            }
        });
    });

    socket.on('/api/blackout', function(data) {
        var id = data.id;
        var sqlCount = "SELECT COUNT(*) FROM blackout";
        conn.query(sqlCount, (err, results) => {
            if (err) {
                console.log(err);
            }
            var count = parseInt(results[0]['COUNT(*)']);
            if (count == 0) {
                return socket.emit('/api/blackout', JSON.stringify({"status": 200, "error": null, "response": 'No users in blackout'}));
            } else {
                var sqlBlackout = "SELECT user.id, blackout.householdid, datet.dt FROM blackout INNER JOIN user ON blackout.householdid=user.householdid INNER JOIN datet ON datet.id=blackout.datetimeid ORDER BY datet.dt DESC LIMIT 20";
                conn.query(sqlBlackout, (err, results) => {
                    if (err) {
                        console.log(err);
                    }
                    return socket.emit('/api/blackout', JSON.stringify({"status": 200, "error": null, "response": results}));
                });
            }
        });
    });

    // Disconnect listener
    socket.on('disconnect', function() {
        console.log('Client disconnected.');
    });
});

//http://35.173.230.193:3000/api/electricityconsumtion