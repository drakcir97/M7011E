
const express = require('express')
const app = express()

var randomNormal = require('random-normal')
var mysql = require('mysql');
var config = require("../config/simulatorconfig");

//	var elePro = ((1.3968**windSpeedCurrentTime)*56.94).toFixed(3);
var apartmentPower = config.simulatorvar.apartmentPower; //Average power used by an apartment.
var housePower = config.simulatorvar.housePower; //Average power used by house.
var	tempMinAffect = config.simulatorvar.tempMinAffect; //At this value no power goes to heat.
var	tempMaxAffect = config.simulatorvar.tempMaxAffect; //At this value maximum power goes to heat.
var	tempAffect = config.simulatorvar.tempAffect; //Maximum affect temperature has.
var	tempCoefficient = config.simulatorvar.tempCoefficient; //Procentage that is affected by temperature.

//THESE ARE NOW ONLY GLOBAL TEMPORARY VARIABLES. VALUE CHANGES AT WILL AND IS NOT STABLE. IS UPDATED EACH TIME A USER BUYS POWER.
var	powerCostHigh = config.simulatorvar.powerCostHigh; //Cost if powerplant
var	powerCostLow = config.simulatorvar.powerCostLow; //Cost if wind

var con = mysql.createConnection({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database
});

function getNormValues(meanIn, stIn){
	var meanVal = randomNormal({mean: meanIn, dev: stIn});
	return  meanVal;

}

//Generates temperature, using smhi rest api
async function generateTemperature(location, date, dateid,callback) {
	const request = require('request')
	request({
		//url below has the id for Arvidsjaur
		url: 'https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/159880/period/latest-hour/data.json',
		json: true
		}, async function(error, response, body) {
		var test = body;
		var objVal = test.value;
//		var location = test.station.name;
		var temperature = (parseFloat(JSON.stringify(objVal[0].value).slice(1, -1)));
		var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
		con.query(sqlLocation, async function (err, result) {
			if (err) {
				console.log(err);
			};           
			//var nowDate = new Date(); 
			//var date = nowDate.getFullYear()+'-'+(nowDate.getMonth()+1)+'-'+nowDate.getDate(); 
			var locationId = result[0]['id'];
			var sql = mysql.format("INSERT INTO temperature (locationid, temperature, datetimeid) VALUES (?,?,?)", [locationId, temperature, dateid]);
			con.query(sql, async function(err, result) {
				if (err) {
					console.log(err);
				};
				console.log("Temperature was inserted");
				try {
					callback(location, date, dateid,genPower);
				} catch (e) {
					console.log("Can't run");
				}
			});
		});
	});
		
}

//Generates a date object in db, used to update values. Returns two dates, one with time, one without.
async function generateDate(callback) {
	var dateid = 0;
	var dateTime = require('node-datetime');
	var dt = dateTime.create();
	var formatted = dt.format('Y-m-d H:M:S');
	var lookupDate = formatted;
	console.log(formatted);
	var sqlInsert = mysql.format("INSERT INTO datet (dt) VALUES (?)", [formatted]);
	// SELECT fields FROM table ORDER BY id DESC LIMIT 1;
	//INSERT INTO blog(title,desc) VALUES ('blog1','description'); SELECT * FROM blog
	con.query(sqlInsert, async function (err, result) {
		if (err) {
			console.log(err);
		};
		console.log("date was inserted");
		console.log(lookupDate);
		var sqlLookup = mysql.format("SELECT id FROM datet WHERE dt=?", [lookupDate]);
		//var sqlLookup = "SELECT id FROM datet ORDER BY id DESC LIMIT 1";
		con.query(sqlLookup, async function (err, result) {
			if (err) {
				try {
					callback(err, null);
				} catch (e) {
					console.log("Can't run");
				}
			} else {
				try {
					console.log("should return ",result[0]['id']);
					callback(null, result[0]['id']);
				} catch (e) {
					console.log("Can't run");
				}
			}
		});
	});
//		console.log("testDate",result[0]['id']);
//		dateid = result[0]['id'];
//		console.log(dateid);
//		return dateid;
		
	
//	return dateid;
}

//Tests if wind for day and location already exists, return true if it does.
async function testWindForDay(location,date, callback) {
	//below i think we try to check locationid with location
	//date should be enough?
	var sql = mysql.format("SELECT COUNT(i) FROM averagewindspeed WHERE dt=?", [date]);
	con.query(sql, async function (err, result) {
		if (err) {
			try {
				callback(err, null);
			} catch (e) {
				console.log("Can't run");
			}
		}
		var count = parseInt(result[0]['COUNT(i)']);
		console.log("this is the result of wind for today already exists ",count);
		if (count == 0) {
			try {
				callback(null, false);
			} catch (e) {
				console.log("Can't run");
			}
		}
		else{
			try {
				callback(null, true);
			} catch (e) {
				console.log("Can't run");
			}
		}
	});
}

//Generates average wind for date for location if it does not exist.
async function generateWindForDay(location,date){
	//createLocation(location);
	testWindForDay(location,date, async function(err, data) {
		if(err){
			console.log("error");
		}
		else{
			console.log("data is ",data);
			if(data == false){
				var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
				con.query(sqlLocation, async function (err, result) {
        			if (err) {
						console.log(err);
					};
					var meanWind = getNormValues(7, 2);
					var locationId = result[0]['id'];
        			var sql = mysql.format("INSERT INTO averagewindspeed (locationid, windspeed, dt) VALUES (?,?,?)", [locationId, meanWind, date]);
    				con.query(sql, async function (err, result) {
            			if (err) {
							console.log(err);
						};
            			console.log("1 record inserted");
					});
				});
			}
			else {
				console.log("already has a wind for today");
			}
		}
	});
}

//Generate wind for location using average for that day.
async function generateWindForTime(location,date,dateid,callback) {
	var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
	con.query(sqlLocation, async function (err, result) {
		if (err) {
			console.log(err);
		};
		var locationId = result[0]['id'];
		var sqlGetAvg = mysql.format("SELECT windspeed FROM averagewindspeed WHERE dt=? AND locationid=?", [date,locationId]);
		con.query(sqlGetAvg, async function(err, result) {
			if (err) {
				console.log(err);
			};
			//console.log(result[0]);
			var avgForDay = result[0]['windspeed'];
			var meanWind = getNormValues(avgForDay,2); //Replace later for real deviation.
			var sql = mysql.format("INSERT INTO windspeed (locationid, windspeed, datetimeid) VALUES (?,?,?)", [locationId,meanWind,dateid]);
			con.query(sql, async function (err, result) {
				if (err) {
					console.log(err);
				};
				try {
					callback(genTotalPower);
				} catch (e) {
					console.log("Can't run");
				}
			});
		});
	});
}

//Generates power generated for household using windspeed.
async function generatePowerForTime(householdid,dateid) {
	var sqlType = mysql.format("SELECT windspeed FROM windspeed WHERE datetimeid=?", [dateid]);
	con.query(sqlType, async function (err, result) {
		if (err) {
			console.log(err);
		};
		//console.log(result);
		var windSpeedCurrentTime = result[0]['windspeed'];
		var meanPwr = ((1.3968**windSpeedCurrentTime)*56.94).toFixed(3);
		var sqlInsert = mysql.format("INSERT INTO powergenerated (householdid, value, datetimeid) VALUES (?,?,?)", [householdid,meanPwr,dateid]);
		con.query(sqlInsert, async function(err, result) {
			if (err) {
				console.log(err);
			};
		});
	});
}

//Generates power used using temperature and values from config.
async function generatePowerUsageForTime(householdid,dateid,callback) {
	var sqlType = mysql.format("SELECT housetype FROM household WHERE id=?", [householdid]);
	con.query(sqlType, async function (err, result) {
		if (err) {
			console.log(err);
		};
		var housetype = result[0]['housetype'];
		var sqlTemp = mysql.format("SELECT temperature FROM temperature WHERE datetimeid=?", [dateid]);
		con.query(sqlTemp, async function(err, result) {
			if (err) {
				console.log(err);
			};
			var temp = result[0]['temperature'];
			var typePwr = 0;
			if (housetype == "apartment") {
				typePwr = apartmentPower;
			} else {
				typePwr = housePower;
			}
			var meanPwr = getNormValues(typePwr,typePwr*0.2);
			var tempPwr = 0;
			if (temp > tempMinAffect) { //Temp is higher then minumum affect, 0 goes to heating.
				tempPwr = 0;
			} else if (temp < tempMaxAffect) { //Temp is lower then max affect, max to heating.
				tempPwr = meanPwr*tempCoefficient*tempAffect; 
			} else { //Somewhere inbetween, calculate amount using linear division of affect.
				tempPwr = meanPwr*tempCoefficient*tempAffect*(1-(temp+Math.abs(tempMaxAffect))/(Math.abs(tempMaxAffect)+Math.abs(tempMinAffect)));
			}
			var pwr = (1-tempCoefficient) * meanPwr + tempPwr;
			var sqlInsert = mysql.format("INSERT INTO powerusage (householdid, value, datetimeid) VALUES (?,?,?)", [householdid,pwr,dateid]);
			con.query(sqlInsert, async function(err, result) {
				if (err) {
					console.log(err);
				};
			});
		});
	});
}

//Creates location if it does not exist.
async function createLocation(location, callback){
	console.log("location in createlocation",location);
	var sql = mysql.format("SELECT COUNT(id) FROM location WHERE name=?", [location]);  
    con.query(sql, async function (err, result) {
        if (err) {
			console.log(err);
		};         
		console.log("Number of location found",result[0]['COUNT(id)']);
		var count = result[0]['COUNT(id)'];
		if (count == 0) {
        	var sqlInsert = mysql.format("INSERT INTO location (name) VALUES (?)", [location]);
			console.log("Passed count == 0");
            con.query(sqlInsert, async function(err, result) {
                if (err) {
					console.log(err);
				};
				console.log("Location not found, was inserted");
				try {
					callback();
				} catch (e) {
					console.log("Can't run");
				}
            });
		} else {
			try {
				callback();
			} catch (e) {
				console.log("Can't run");
			}
		}
    });
}

async function createPowerplant(location, callback) {
	var sql = mysql.format("SELECT COUNT(powerplant.id) FROM powerplant INNER JOIN location ON powerplant.locationid=location.id WHERE location.name=?",[location]);
	con.query(sql, async function(err, results) {
		if (err) {
			console.log(err);
		} else {
			var count = parseInt(results[0]['COUNT(powerplant.id)']);
			if (count == 0) {
				var sqlLocationId = mysql.format("SELECT id FROM location WHERE name=?", [location]);
				con.query(sqlLocationId, async function(err, results) {
					if (err) {
						console.log(err)
					}
					var locationid = results[0]['id'];
					var sqlInsert = mysql.format("INSERT INTO powerplant (locationid, maxpower, currentpower, buffer, ratiokeep, status) VALUES (?,?,?,?,?,?)", [locationid,20000,0,0,0.1,'stopped']);
					con.query(sqlInsert, async function(err, results) {
						if (err) {
							console.log(err);
						}
						console.log("Plant not found, was inserted: createPowerplant")
						try {
							callback();
						} catch (e) {
							console.log("Can't run");
						}
					});
				})
			} else {
				console.log("Plant was found, not inserted: createPowerplant");
				try {
					callback();
				} catch (e) {
					console.log("Can't run");
				}
			}
		}
	});
}

function getPowerTotalIn(dateid,callback) {
	var sql = mysql.format("SELECT powerin FROM powertotal WHERE datetimeid=?", [dateid]);
	con.query(sql, async function (err, result) {
		if (err) {
			try {
				callback(err, null);
			} catch (e) {
				console.log("Can't run");
			}	
		} else {
			var totalin = result[0]['powerin'];
			try {
				callback(null, totalin);
			} catch (e) {
				console.log("Can't run");
			}
		}
	});
}

function getPowerTotalOut(dateid,callback) {
	var sql = mysql.format("SELECT powerout FROM powertotal WHERE datetimeid=?", [dateid]);
	con.query(sql, async function (err, result) {
		if (err) {
			try {
				callback(err,null);
			} catch (e) {
				console.log("Can't run");
			}
		} else {
			var totalout = result[0]['powerout'];
			try {
				callback(null,totalout);
			} catch (e) {
				console.log("Can't run");
			}
		}
	});
}

async function createbuffer(householdid,callback) {
	var sqlCheckBuffer = mysql.format("SELECT COUNT(value) FROM powerstored WHERE householdid=?", [householdid]);
	con.query(sqlCheckBuffer, async function(err, results) {
		if (err) {
			console.log(err);
		}
		var count = parseInt(results[0]['COUNT(value)']);
		if (count == 0) {
			sqlInsertBuffer = mysql.format("INSERT INTO powerstored (householdid, value) VALUES (?,?)", [householdid,0]);
			con.query(sqlInsertBuffer, async function(err, results) {
				if (err) {
					console.log(err);
				}
				try {
					callback(null, true);
				} catch (e) {
					console.log("Can't run");
				}
			})
		} else {
			try {
				callback(null, false);
			} catch (e) {
				console.log("Can't run");
			}
		}
	});
}

//Put powertobuffer into buffer in database.
async function putinbuffer(householdid,powertobuffer) {
	var buffer = 0;
	var sqlCheckBuffer = mysql.format("SELECT COUNT(value) FROM powerstored WHERE householdid=?", [householdid]);
	con.query(sqlCheckBuffer, async function(err, results) {
		if (err) {
			console.log(err);
		}
		var count = parseInt(results[0]['COUNT(value)']);
		if (count == 0) {
			return 0;
		} else {
			var sqlBuffer = mysql.format("SELECT value FROM powerstored WHERE householdid=?", [householdid]);
			con.query(sqlBuffer, async function(err, result) {
				if (err) {
					console.log(err);
				};
				buffer = parseFloat(result[0]['value']); //Get old value
				var sqlBuffer = mysql.format("UPDATE powerstored SET value=? WHERE householdid=?",[buffer+powertobuffer,householdid]); //Update to new value.
				con.query(sqlBuffer, async function(err, result) {
					if (err) {
						console.log(err);
					};
				});
			});
		}
	});
};

//Get powerneeded amount of power from buffer in database. If excess, store it. Return number of power the buffer can max supply up to powerneeded.
async function getfrombuffer(householdid,powerneeded,callback) {
	var buffer = 0;
	var sqlCheckBuffer = mysql.format("SELECT COUNT(value) FROM powerstored WHERE householdid=?", [householdid]);
	con.query(sqlCheckBuffer, async function(err, results) {
		if (err) {
			console.log(err);
		}
		var count = parseInt(results[0]['COUNT(value)']);
		if (count == 0) {
			console.log("RETURN VALUE 0  ");
			try {
				callback(null, 0);
			} catch (e) {
				console.log("Can't run");
			}
			//return 0;
		} else {
			var sqlBuffer = mysql.format("SELECT value FROM powerstored WHERE householdid=?", [householdid]);
			con.query(sqlBuffer, async function(err, result) {
				if (err) {
					console.log(err);
				};
				buffer = parseFloat(result[0]['value']); //Get old value
				if (buffer<powerneeded) { //There is less power then we need in buffer.
					var sqlBuffer = mysql.format("UPDATE powerstored SET value=? WHERE householdid=?",[0,householdid]); //0 power remaining.
					con.query(sqlBuffer, async function(err, result) {
						if (err) {
							console.log(err);
						};
						console.log("RETURN VALUE BUFFER  "+buffer);
						try {
							callback(null, buffer);
						} catch (e) {
							console.log("Can't run");
						}
						//return buffer; //Return everything we had in buffer.
					});
				} else {
					var sqlBuffer = mysql.format("UPDATE powerstored SET value=? WHERE householdid=?",[buffer-powerneeded,householdid]); //Update power remaining.
					con.query(sqlBuffer, async function(err, result) {
						if (err) {
							console.log(err);
						};
						console.log("RETURN VALUE POWERNEEDED  "+buffer);
						try {
							callback(null, powerneeded);
						} catch (e) {
							console.log("Can't run");
						}
						//return powerneeded; //Return power we needed.
					});
				}
			});
		}
	});
}

async function blackout(householdid,dateid,callback) {
	var sqlInsert = mysql.format("INSERT INTO blackout (householdid, datetimeid) VALUES (?,?)", [householdid,dateid]);
	con.query(sqlInsert, async function(err, result) {
		if (err) {
			console.log(err);
		}
		try {
			callback(null, null);
		} catch (e) {
			console.log("Can't run");
		}
	});
}

async function generatePowerCost(householdid, dateid, totalin, totalout,totalhouseholds) {
	console.log("houseid in powercost ",householdid," ",dateid);
	var powergenerated = 0;
	var powerusage = 0;
	var powersum = 0;
	var powercost = 0;
	var powerkeep = 0;
	await createbuffer(householdid, async function(err, createbufferData) {
		if (err) {
			console.log(err);
		}
		await fetchSettings(householdid, async function(err, fetchData) { //Change powercost to that of users plant, if settings for powerplant does not exist, create them.
			if (err) {
				console.log(err);
			}
			var sqlSettingsCheck = mysql.format("SELECT COUNT(simulationsettings.ratiokeep) FROM simulationsettings INNER JOIN user ON simulationsettings.userid=user.id WHERE user.householdid=?", [householdid]);
			con.query(sqlSettingsCheck, async function(err, result) {
				var count = result[0]['COUNT(simulationsettings.ratiokeep'];
				console.log("Count in powercost: "+count);
				if (count) {
					var sqlSettings = mysql.format("SELECT simulationsettings.ratiokeep,simulationsettings.ratiosell FROM simulationsettings INNER JOIN user ON simulationsettings.userid=user.id WHERE user.householdid=?", [householdid]);
					con.query(sqlSettings, async function(err,result) {
						var ratiokeep = result[0]['simulationsettings.ratiokeep'];
						var ratiosell = result[0]['simulationsettings.ratiosell'];
						con.query(sqlGen, async function (err, result) {
							powergenerated = parseFloat(JSON.stringify(result[0].value));
							var sqlUsage = mysql.format("SELECT value FROM powerusage WHERE householdid=? AND datetimeid=?", [householdid,dateid]);
							con.query(sqlUsage, async function (err, result) {
								powerusage = parseFloat(JSON.stringify(result[0].value));
								powersum = powergenerated - powerusage;
								if(powersum >= 0) { //We generated excess power.
									powerkeep = powersum * (1-ratiosell); //Keep amount of power from settings
									await putinbuffer(householdid,powerkeep); //Put power stored into buffer. Powerkeep is positive.
									powercost = powerCostLow*(powersum * ratiosell);
								} else { //We need to buy power.
									var powerneededfrombuffer = -(1-ratiokeep) * powersum;
									await getfrombuffer(householdid, powerneededfrombuffer, async function(err,dataBuffer) {
										if (err) {
											console.log("error");
										} else {
											// var powerfrombuffer = await getfrombuffer(householdid, powerneededfrombuffer);
											// console.log("BUFFER POWER  "+powerfrombuffer);
											// console.log("POWERSUM BEFORE  "+powersum);
											powersum += dataBuffer; //Add power we got from buffer, will still be negative.
											//console.log("POWERSUM AFTER  "+powersum);
											if (totalin>totalout) {
												powercost = powerCostLow*powersum;
											} else {
												if ((powersum + totalin/totalhouseholds) > 0) {
													powercost = powerCostLow*powersum;
												} else {
													var powerCheap = totalin/totalhouseholds;
													var powerExpensive = (powersum+powerCheap);
													await buyFromPlant(householdid, -powerExpensive, async function(err,dataPlant) {
														if (powerExpensive!=dataPlant) {
															await blackout(householdid,dateid, async function(err, dataBout) {});
														}
														powercost = dataPlant*powerCostHigh - powerCheap*powerCostLow;
													});
												}
											}
										}
									});
								} 
								var sqlCost = mysql.format("INSERT INTO powercosthousehold (householdid, value, datetimeid) VALUES (?,?,?)", [householdid,powercost,dateid]);
								con.query(sqlCost, async function(err, result) {
									if (err) {
										console.log(err);
									};
								});
							});
						});
					});	
				} else {
					var ratiokeep = 0.5;
					var ratiosell = 0.5;
					var sqlGen = mysql.format("SELECT value FROM powergenerated WHERE householdid=? AND datetimeid=?", [householdid,dateid]);
					con.query(sqlGen, async function (err, result) {
						powergenerated = parseFloat(JSON.stringify(result[0].value));
						var sqlUsage = mysql.format("SELECT value FROM powerusage WHERE householdid=? AND datetimeid=?", [householdid,dateid]);
						con.query(sqlUsage, async function (err, result) {
							powerusage = parseFloat(JSON.stringify(result[0].value));
							powersum = powergenerated - powerusage;
							if(powersum >= 0) { //We generated excess power.
								powerkeep = powersum * (1-ratiosell); //Keep amount of power from settings
								await putinbuffer(householdid,powerkeep); //Put power stored into buffer. Powerkeep is positive.
								powercost = powerCostLow*(powersum * ratiosell);
							} else { //We need to buy power.
								var powerneededfrombuffer = -(1-ratiokeep) * powersum;
								await getfrombuffer(householdid, powerneededfrombuffer, async function(err,dataBuffer) {
									if (err) {
										console.log("error");
									} else {
										// var powerfrombuffer = await getfrombuffer(householdid, powerneededfrombuffer);
										// console.log("BUFFER POWER  "+powerfrombuffer);
										// console.log("POWERSUM BEFORE  "+powersum);
										powersum += dataBuffer; //Add power we got from buffer, will still be negative.
										//console.log("POWERSUM AFTER  "+powersum);
										if (totalin>totalout) {
											powercost = powerCostLow*powersum;
										} else {
											if ((powersum + totalin/totalhouseholds) > 0) {
												powercost = powerCostLow*powersum;
											} else {
												var powerCheap = totalin/totalhouseholds;
												var powerExpensive = (powersum+powerCheap);
												await buyFromPlant(householdid, -powerExpensive, async function(err,dataPlant) {
													if (powerExpensive!=dataPlant) {
														await blackout(householdid,dateid, async function(err, dataBout) {});
													}
													powercost = dataPlant*powerCostHigh - powerCheap*powerCostLow;
												});
											}
										}
									}
								});
							} 
							var sqlCost = mysql.format("INSERT INTO powercosthousehold (householdid, value, datetimeid) VALUES (?,?,?)", [householdid,powercost,dateid]);
							con.query(sqlCost, async function(err, result) {
								if (err) {
									console.log(err);
								};
							});
						});
					});
				}
			});
		});
	});
}

//Returns amount that could be bought from powerplant, up to amountOfPower.
async function buyFromPlant(householdid, amountOfPower,callback) {
	await checkIfBlocked(householdid, async function(err, blocked) {
		if (!blocked) {
			var sqlLocationId = mysql.format("SELECT powerplant.id FROM powerplant INNER JOIN household ON powerplant.locationid=household.locationid WHERE household.id=?",[householdid]);
			con.query(sqlLocationId, (err, results) => {
				if (err) {
					console.log(err);
				} else {
					var plantid = results[0]['id'];
					console.log("POWERPLANT ID  "+plantid);
					var sqlPower = mysql.format("SELECT status,buffer,currentpower,maxpower,ratiokeep FROM powerplant WHERE id=?", [plantid]);
					con.query(sqlPower, (err, results) => {
						var plantstatus = results[0]['status'];
						var plantbuffer = parseFloat(results[0]['buffer']);
						var plantcurrentpower = parseFloat(results[0]['currentpower']);
						var plantmaxpower = parseFloat(results[0]['maxpower']);
						var plantratiokeep = parseFloat(results[0]['ratiokeep']);
						if (plantstatus == 'running') {
							if (plantcurrentpower < amountOfPower) {
								var sqlSet0 = mysql.format("UPDATE powerplant SET plantcurrentpower=0 WHERE id=?", [plantid]);
								con.query(sqlSet0, (err, results) => {
									if (err) {
										console.log(err);
									}
									try {
										callback(null, plantcurrentpower);
									} catch (e) {
										console.log("Can't run");
									}
								});
							} else {
								var sqlReduce = mysql.format("UPDATE powerplant SET plantcurrentpower=? WHERE id=?", [plantcurrentpower-amountOfPower,plantid]);
								con.query(sqlReduce, (err, results) => {
									if (err) {
										console.log(err);
									}
									try {
										callback(null, amountOfPower);
									} catch (e) {
										console.log("Can't run");
									}
								});
							}
						} else {
							if (plantbuffer < amountOfPower) {
								var sqlSet0 = mysql.format("UPDATE powerplant SET buffer=0 WHERE id=?", [plantid]);
								con.query(sqlSet0, (err, results) => {
									if (err) {
										console.log(err);
									}
									try {
										callback(null, plantbuffer);
									} catch (e) {
										console.log("Can't run");
									}
								});
							} else {
								var sqlReduce = mysql.format("UPDATE powerplant SET buffer=? WHERE id=?", [plantbuffer-amountOfPower,plantid]);
								con.query(sqlReduce, (err, results) => {
									if (err) {
										console.log(err);
									}
									try {
										callback(null, amountOfPower);
									} catch (e) {
										console.log("Can't run");
									}
								});
							}
						}
					});
				}
			});
		} else {
			try {
				callback(null, 0);
			} catch (e) {
				console.log("Can't run");
			}
		}
	});
}

async function checkIfBlocked(householdid,callback) {
	var sqlBanned = mysql.format("SELECT COUNT(dt) FROM blockedhousehold WHERE householdid=?", [householdid]);
	con.query(sqlBanned, async function(err, results) {
		if (err) {
			console.log(err);
		} else {
			var num = parseInt(results[0]['COUNT(dt)']);
			if (num != 0) {
				var sqlBanned = mysql.format("SELECT dt FROM blockedhousehold WHERE householdid=?", [householdid]);
				con.query(sqlBanned, async function(err, results) {
					if (err) {
						console.log(err);
					} else {
						var banned = parseInt(results[0]['dt']);
						var d = new Date();
						var currenttime = d.getTime()/1000;
						if (banned <= currentime) {
							var sqlRemove = mysql.format("DELETE FROM blockedhousehold WHERE householdid=?", [householdid]);
							con.query(sqlRemove, async function(err, results) {
								if (err) {
									console.log(err);
								}
								try {
									callback(null, false);
								} catch (e) {
									console.log("Can't run");
								}
							});
						} else {
							try {
								callback(null, true);
							} catch (e) {
								console.log("Can't run");
							}
						}
					}
				});
			} else {
				try {
					callback(null, false);
				} catch (e) {
					console.log("Can't run");
				}
			}
		}
	});
}

//Updates all powerplants that exist in simulator.
async function updatePowerPlant(callback) {
	var sql = "SELECT id FROM powerplant";
	con.query(sql, async function (err, result) {
		if (err) {
			console.log(err);
		};
		for(val of result) {
			var sqlPower = mysql.format("SELECT status,buffer,currentpower,maxpower,ratiokeep FROM powerplant WHERE id=?", [val.id]);
			con.query(sqlPower, (err, results) => {
				var plantstatus = results[0]['status'];
				var plantbuffer = parseFloat(results[0]['buffer']);
				var plantcurrentpower = parseFloat(results[0]['currentpower']);
				var plantmaxpower = parseFloat(results[0]['maxpower']);
				var plantratiokeep = parseFloat(results[0]['ratiokeep']);

				if (plantstatus == 'running') {
					var newBuffer = plantmaxpower * plantratiokeep + plantbuffer + plantcurrentpower; //We send all power that is not sold to buffer.
					var newCurrent = plantmaxpower * (1-plantratiokeep);

					var sqlPlant = mysql.format("UPDATE powerplant SET buffer=?, plantcurrentpower=? WHERE id=?", [newBuffer,newCurrent,val.id]);
					con.query(sqlPlant, (err, results) => {
						if (err) {
							console.log(err);
						};
					});
				} else if (plantstatus == 'starting') {
					var sqlUpdate = mysql.format("UPDATE powerplant SET status='running' WHERE id=?", [val.id]);
					con.query(sqlUpdate, (err, results) => {
						if (err) {
							console.log(err);
						};
					});
				}
			});
		}
		try {
			callback();
		} catch (e) {
			console.log("Can't run");
		}
	});
}

//Fetches this households powercosts and CHANGES local variables to match.
async function fetchSettings(householdid,callback) {
	var sqlCount = mysql.format("SELECT COUNT(powerplantsettings.id) FROM powerplantsettings INNER JOIN powerplant ON powerplantsettings.powerplantid=powerplant.id INNER JOIN household ON powerplant.locationid=household.locationid WHERE household.id=?", [householdid]);
	con.query(sqlCount, async function(err, result) {
		if (err) {
			console.log(err);
		};
		var count = parseInt(result[0]['COUNT(powerplantsettings.id)']);
		if (count == 0) { //Settings do not exist, create with config value and set current cost to new value.
			var sqlPlantId = mysql.format("SELECT powerplant.id FROM powerplant INNER JOIN household ON powerplant.locationid=household.locationid WHERE household.id=?", [householdid]);
			con.query(sqlPlantId, async function(err, result) {
				if (err) {
					console.log(err);
				};
				var plantid = result[0]['powerplant.id'];
				var sqlInsert = mysql.format("INSERT INTO powerplantsettings (powerplantid, powerCostLow, powerCostHigh) VALUES (?,?,?)", [plantid,config.simulatorvar.powerCostLow,config.simulatorvar.powerCostHigh]);
				con.query(sqlInsert, async function(err, result) {
					if (err) {
						console.log(err);
					};
					powerCostHigh = config.simulatorvar.powerCostHigh; //Cost if powerplant
					powerCostLow = config.simulatorvar.powerCostLow; //Cost if wind
					try {
						callback();
					} catch (e) {
						console.log("Can't run");
					}
				});
			});
		} else { //Settings do not exist, fetch them and set 'local' instance of powercost to those found in settings.
			var sqlSettings = mysql.format("SELECT powerplantsettings.powerCostLow, powerplantsettings.powerCostHigh FROM powerplantsettings INNER JOIN powerplant ON powerplantsettings.powerplantid=powerplant.id INNER JOIN household ON powerplant.locationid=household.locationid WHERE household.id=?", [householdid]);
			con.query(sqlSettings, async function(err, result) {
				if (err) {
					console.log(err);
				};
				powerCostHigh = parseFloat(result[0]['powerplantsettings.powerCostHigh']); //Cost if powerplant
				powerCostLow = parseFloat(result[0]['powerplantsettings.powerCostLow']); //Cost if wind
				try {
					callback();
				} catch (e) {
					console.log("Can't run");
				}
			});
		}
	});
}

async function generatePowerTotal(dateid,callback) {
//	(parseFloat(JSON.stringify(objVal[0].value)));
	var totalgenerated = 0;
	var totalused = 0;
	var sql = mysql.format("SELECT value FROM powergenerated WHERE datetimeid=?", [dateid]);
	con.query(sql, async function (err, result) {
		if (err) {
			console.log(err);
		};
		for(val of result) {
			totalgenerated = totalgenerated + parseFloat(JSON.stringify(val.value));
		}
		var sql = mysql.format("SELECT value FROM powerusage WHERE datetimeid=?", [dateid]);
		con.query(sql, async function (err, result) {
			if (err) {
				console.log(err);
			}; 
			for(val of result) {
				totalused = totalused + parseFloat(JSON.stringify(val.value));
			}
			var sql = mysql.format("INSERT INTO powertotal (powerin,powerout,datetimeid) VALUES (?,?,?)", [totalgenerated, totalused, dateid]);
			con.query(sql, async function (err, result) {
				if (err) {
					console.log(err);
				};
				console.log("Total power inserted");
				try {
					callback();
				} catch (e) {
					console.log("Can't run");
				}
			});
		});
	});
}

async function getDate(callback) {
	var sqlLookup = "SELECT id FROM datet ORDER BY id DESC LIMIT 1";
	con.query(sqlLookup, async function (err, result) {
		if (err) {
			try {
				callback(err, null);
			} catch (e) {
				console.log("Can't run");
			}
		} else {
	//		console.log("should return ",result[0]['id']);
			callback(null, result[0]['id']);
		}
	});
}

async function getHouseholds(callback) {
	var sqlHousehold = "SELECT id FROM household";
	con.query(sqlHousehold, async function (err, result) {
		if (err) {
			try{
				callback(err,null);
			} catch (e) {
				console.log("Can't run");
			}
		} else {
			callback(null,result);
		}
	});
}

async function checkTestHouseholds(location) {
	var sqlCountHousehold = "SELECT COUNT(id) FROM household";
	con.query(sqlCountHousehold, async function (err, result) {
		var totalhouseholds = result[0]['COUNT(id)'];
		if (totalhouseholds == "0") {
			await createTestHouseholds(location);
		}
	});
} 

async function createTestUsers() {
	console.log("Creating users");
	var sqlHousehold = "SELECT COUNT(*) FROM household";
	con.query(sqlHousehold, async function (err, results) {
		if (err) {
			console.log(err);
		}
		var numberOfHouseholds = parseInt(results[0]['COUNT(*)']);
		for(var i = 1; i<8; i++) {
			console.log("Householdid & userid: "+i)
			var sql = mysql.format("INSERT INTO user (householdid) VALUES (?)", [i]);
			con.query(sql, async function(err, results) {
				if (err) {
					console.log(err);
				}
				// var sqlSettings = mysql.format('INSERT INTO simulationsettings (userid) VALUES (?)', [i]);
				// con.query(sqlSettings, function(err, results) {
				// 	if (err) {
				// 		console.log(err);
				// 	}
				// });
			});
		}
	});
}

async function createTestHouseholds(location) {
	console.log("Location in createTestHouseholds",location);
	var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
	var apartment = "apartment";
	var house = "house";
	con.query(sqlLocation, async function (err, result) {
		var locationid = result[0]['id'];
		var i = 0;
		console.log("locationid ",locationid);
		while(i<5) {
			var sql = mysql.format("INSERT INTO household (locationid,housetype) VALUES (?,?)", [locationid, apartment]);
			con.query(sql, async function (err, result) {
				if (err) {
					console.log(err);
				};
			});
			i=i+1;
		}
		var j = 0;
		while (j<2) {
	//		console.log("j",j);
			var sql = mysql.format("INSERT INTO household (locationid,housetype) VALUES (?,?)", [locationid, house]);
			con.query(sql, async function (err, result) {
				if (err) {
					console.log(err);
				};
			});
			j=j+1;
		}
		var sqlHousehold = "SELECT COUNT(*) FROM household";
		con.query(sqlHousehold, async function (err, result) {
		//	console.log(result[0]['COUNT(*)']);
		});
		console.log("Inserted households to test");
		await createTestUsers();
	});
}

async function genWindAndTemp(location,date) {
	await generateDate(async function(err, data) {
		if(err) {
			console.log("error");
		} else {
			console.log("got an result from dateid ",data);
			await generateTemperature(location, date, data,generateWindForTime);
			//await generateWindForTime(location, date, data,genPower);
			//generatePowerTotal(data);
		}
	});
}

async function genPower(callback) {
	await getDate(async function(err, data) {
		if (err) {
			console.log("error");
		} else {
			console.log("got an result from dateid ",data);
			await getHouseholds(async function(err,data_households) {
				if (err) {
					console.log("error");
				} else {
					for(house of data_households) {
						//console.log("house",house);
						await generatePowerForTime(JSON.stringify(house.id),data);
						await generatePowerUsageForTime(JSON.stringify(house.id),data);
					}
					try {
						callback();
					} catch (e) {
						console.log("Can't run");
					}
				}
			});
		}
	});
}

async function genTotalPower() {
	await getDate(async function(err, data) {
		if (err) {
			console.log("error");
		} else {
			await generatePowerTotal(data, async function(err,dataTotal) {
				if (err) {
					console.log("error");
				} else {
					await getPowerTotalIn(data, async function(err, dataIn){
						if (err) {
							console.log("error");
						} else {
							await getPowerTotalOut(data, async function(err, dataOut){
								if (err) {
									console.log("error");
								} else {
									var sqlCountHousehold = "SELECT COUNT(id) FROM household";
									con.query(sqlCountHousehold, async function (err, result) {
										var sqlHousehold = "SELECT id FROM household";
										var totalhouseholds = result[0]['COUNT(id)'];
										con.query(sqlHousehold, async function (err, result) {
											for(house of result) {
												generatePowerCost(JSON.stringify(house.id), data,dataIn,dataOut,totalhouseholds);
											}
										});
									});
								}
							});
						}
					});
				}
			});
		}
	});
}

//Updates values in db. That is, generates new values and inserts them accordingly.
async function update() {
	var location = "Boden";
	var nowDate = new Date(); 
	var date = nowDate.getFullYear()+'-'+(nowDate.getMonth()+1)+'-'+nowDate.getDate();
	await createLocation(location, async function (err, data) {
		if (err) {
			console.log(err);
		} else {
			await createPowerplant(location, async function(err, data) {
				if (err) {
					console.log(err);
				} else {
					await updatePowerPlant(async function(err, data) {
						if (err) {
							console.log(err);
						} else {
							await checkTestHouseholds(location);
							await generateWindForDay(location, date); // generateWindForTime will select data from averagewindspeed 
							await genWindAndTemp(location,date);
						}
					});
				}
			});
		}
	});
	//await genTotalPower();
	// await genPower();
	// await genWindAndTemp(location,date,async function(err,result) {
	// 	if(err) {
	// 		console.log("error");
	// 	} else {
	// 		await genPower();
	// 	}
	// });
	//console.log("this is dateid ",dateid);
	//await generateTemperature(location, dateid);
	//await generateWindForDay(location,date);
	//generateWindForTime(location,date,dateid);
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
  }

con.connect(async function(err) {
	if (err) {
		console.log(err);
	};
	console.log("Connected to db");
	while(true) {
		update();
		await sleep(10000);
	}
	// var location = "Kiruna";
	// createLocation(location);
	// var temp = generateDate();
	// console.log(temp);
	// var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
	// con.query(sqlLocation, function (err, result) {
	// 	if (err) throw err;
	// 	console.log(result[0]['id']);
	// });
});

//con.end(function(err) {
//	if (err) throw err;
//	console.log("Disconnected from db");
//});
