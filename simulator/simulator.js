
const express = require('express')
const app = express()

var randomNormal = require('random-normal')
var mysql = require('mysql');

//	var elePro = ((1.3968**windSpeedCurrentTime)*56.94).toFixed(3);
var apartmentPower = 300; //Average power used by an apartment.
var housePower = 2500; //Average power used by house.
var	tempMinAffect = 25; //At this value no power goes to heat.
var	tempMaxAffect = -30; //At this value maximum power goes to heat.
var	tempAffect = 2; //Maximum affect temperature has.
var	tempCoefficient = 0.6; //Procentage that is affected by temperature.
var	powerCostHigh = 0.01; //Cost if powerplant
var	powerCostLow = 0.005; //Cost if wind

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "miri"
});

function getNormValues(meanIn, stIn){
	var meanVal = randomNormal({mean: meanIn, dev: stIn});
	return  meanVal;

}

//Generates temperature, using smhi rest api
function generateTemperature(location,dateid) {
	const request = require('request')
	request({
		//url below has the id for Arvidsjaur
		url: 'https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/159880/period/latest-hour/data.json',
		json: true
		}, function(error, response, body) {
		var test = body;
		var objVal = test.value;
//		var location = test.station.name;
		var temperature = (parseFloat(JSON.stringify(objVal[0].value).slice(1, -1)));
		var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
		con.query(sqlLocation, function (err, result) {
			if (err) throw err;           
			//var nowDate = new Date(); 
			//var date = nowDate.getFullYear()+'-'+(nowDate.getMonth()+1)+'-'+nowDate.getDate(); 
			var locationId = result[0]['id'];
			var sql = mysql.format("INSERT INTO temperature (locationid, temperature, datetimeid) VALUES (?,?,?)", [locationId, temperature, dateid]);
			con.query(sql, function(err, result) {
				if (err) throw err;
				console.log("Temperature was inserted");
			});
		});
	});
		
}

//Generates a date object in db, used to update values. Returns two dates, one with time, one without.
function generateDate() {
	var dateTime = require('node-datetime');
	var dt = dateTime.create();
	var formatted = dt.format('Y-m-d H:M:S');
	var lookupDate = formatted;
	console.log(formatted);
	var sqlInsert = mysql.format("INSERT INTO datet (dt) VALUES (?)", [formatted]);
	// SELECT fields FROM table ORDER BY id DESC LIMIT 1;
	//INSERT INTO blog(title,desc) VALUES ('blog1','description'); SELECT * FROM blog
	con.query(sqlInsert, function (err, result) {
		if (err) throw err;
		console.log("date was inserted");
		console.log(lookupDate);
		//var sqlLookup = mysql.format("SELECT id FROM datet WHERE dt=?", [lookupDate]);
		var sqlLookup = "SELECT id FROM datet ORDER BY id DESC LIMIT 1";
		con.query(sqlLookup, function (err, result) {
			//if (err) throw err;
			console.log("testDate",result[0]['id']);
			var dateid = result[0]['id'];
			console.log(dateid);
			return dateid;
		});
	});
	
}

//Tests if wind for day and location already exists, return true if it does.
function testWindForDay(location,date) {
	var sql = mysql.format("SELECT COUNT(i) FROM averagewindspeed WHERE locationid=? AND dt=?", [location,date]);
	con.query(sql, function (err, result) {
		if (err) throw err;
		var count = result[0]['COUNT(i)'];
		if (count == 0) {
			return false;
		}
		return true;
	});
}

//Generates average wind for date for location if it does not exist.
function generateWindForDay(location,date){
	//createLocation(location);
	if (testWindForDay(location,date)==false) {
		var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
		con.query(sqlLocation, function (err, result) {
        	if (err) throw err;
			var meanWind = getNormValues(7, 2);
			var locationId = result[0]['id'];
        	var sql = mysql.format("INSERT INTO averagewindspeed (locationid, windspeed, dt) VALUES (?,?,?)", [locationId, meanWind, date]);
    		con.query(sql, function (err, result) {
            	if (err) throw err;
            	console.log("1 record inserted");
			});
			return date;
		});
	}
}

//Generate wind for location using average for that day.
function generateWindForTime(location,date,dateid) {
	var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
	con.query(sqlLocation, function (err, result) {
		if (err) throw err;
		console.log(result[0]);
		var locationId = result[0]['id'];
		var sqlGetAvg = mysql.format("SELECT windspeed FROM averagewindspeed WHERE dt=? AND locationid=?", [date,locationId]);
		con.query(sqlGetAvg, function(err, result) {
			if (err) throw err;
			var avgForDay = result[0]['windspeed'];
			var meanWind = getNormValues(avgForDay,2); //Replace later for real deviation.
			var sql = mysql.format("INSERT INTO windspeed (locationid, windspeed, datetimeid) VALUES (?,?,?)", [locationId,meanWind,dateid]);
			con.query(sql, function (err, result) {
				if (err) throw err;
			});
		});
	});
}

//Generates power generated for household using windspeed.
function generatePowerForTime(householdid,dateid) {
	var sqlType = mysql.format("SELECT windspeed FROM windspeed WHERE datetimeid=?", [dateid]);
	con.query(sqlLocation, function (err, result) {
		if (err) throw err;
		var windSpeedCurrentTime = result[0]['windspeed'];
		var meanPwr = ((1.3968**windSpeedCurrentTime)*56.94).toFixed(3);
		var sqlInsert = mysql.format("INSERT INTO powergenerated (householdid, value, datetimeid) VALUES (?,?,?)", [householdid,meanPwr,dateid]);
		con.query(sqlInsert, function(err, result) {
			if (err) throw err;
		});
	});
}

//Generates power used using temperature and values from config.
function generatePowerUsageForTime(householdid,dateid) {
	var sqlType = mysql.format("SELECT housetype FROM household WHERE id=?", [householdid]);
	con.query(sqlLocation, function (err, result) {
		if (err) throw err;
		var housetype = result[0]['housetype'];
		var meanPwr = getNormValues(typePwr,typePwr*0.2);
		var sqlTemp = mysql.format("SELECT temperature FROM temperature WHERE datetimeid=?", [dateid]);
		con.query(sqlTemp, function(err, result) {
			if (err) throw err;
			var temp = result[0]['temperature'];
			var typePwr = 0;
			if (housetype == "apartment") {
				typePwr = apartmentPower;
			} else {
				typePwr = housePower;
			}
			var tempPwr = 0;
			if (temp > tempMinAffect) { //Temp is higher then minumum affect, 0 goes to heating.
				tempPwr = 0;
			} else if (temp < tempMaxAffect) { //Temp is lower then max affect, max to heating.
				tempPwr = typePwr*tempCoefficient*tempAffect; 
			} else { //Somewhere inbetween, calculate amount using linear division of affect.
				tempPwr = typePwr*tempCoefficient*temp*(tempAffect/(Math.abs(tempMaxAffect)+Math.abs(tempMinAffect)))
			}
			var pwr = (1-tempCoefficient) * typePwr + tempPwr;
			var sqlInsert = mysql.format("INSERT INTO powerusage (householdid, value, datetimeid) VALUES (?,?,?)", [householdid,pwr,dateid]);
			con.query(sqlInsert, function(err, result) {
				if (err) throw err;
			});
		});
	});
}

//Creates location if it does not exist.
function createLocation(location){
	var sql = mysql.format("SELECT COUNT(*) FROM location WHERE name=?", [location]);  
    con.query(sql, function (err, result) {
        if (err) throw err;           
		console.log("location was found");
		var count = result[0]['COUNT(*)'];
		if (count == 0) {
        	var sqlInsert = mysql.format("INSERT INTO location (name) VALUES (?)", [location]);
			console.log("after");
            con.query(sqlInsert, function(err, result) {
                if (err) throw err;
                console.log("Location not found, was inserted");
            });
		}
    });
}

// function getPowerTotal(dateid) {
// 	var sql = mysql.format("SELECT powerin,powerout FROM powertotal WHERE datetimeid=?", [dateid]);
// 	con.query(sql, function (err, result) {
// 		if (err) throw err;
// 		var totalin = result[0]['powerin'];
// 		var totalout = result[0]['powerout'];
// 		return [[totalin],[totalout]];
// 	});
// }

function generatePowerCost(householdid, dateid, totalin, totalout,totalhouseholds) {
	var powergenerated = 0;
	var powerusage = 0;
	var powersum = 0;
	var powercost = 0;
	var sql = mysql("SELECT value FROM powergenerated WHERE householdid=?", [householdid]);
	con.query(sql, function (err, result) {
		powergenerated = parseFloat(result[0]['value']);
		var sql = mysql("SELECT value FROM powerusage WHERE householdid=?", [householdid]);
		con.query(sql, function (err, result) {
			powerusage = parseFloat(result[0]['value']);
			powersum = powergenerated - powerusage;
			if(powersum >= 0) {
				powercost = powerCostLow*powersum;
			} else {
				if (totalin>totalout) {
					powercost = -powerCostLow*powersum;
				} else {
					if ((powersum + totalin/totalhouseholds) > 0) {
						powercost = powerCostLow*powersum;
					} else {
						var powerCheap = totalin/totalhouseholds;
						var powerExpensive = (powersum+powerCheap);
						powercost = powerExpensive*powerCostHigh - powerCheap*powerCostLow;
					}
				}
			} 
		});
	});
}

function generatePowerTotal(dateid) {
//	(parseFloat(JSON.stringify(objVal[0].value)));
	var totalgenerated = 0;
	var totalused = 0;
	var sql = mysql.format("SELECT value FROM powergenerated WHERE datetimeid=?", [dateid]);
	con.query(sql, function (err, result) {
		if (err) throw err;  
		for(val in result[0]['value']) {
			totalgenerated = totalgenerated + parseFloat(val);
		}
		var sql = mysql.format("SELECT value FROM powerusage WHERE datetimeid=?", [dateid]);
		con.query(sql, function (err, result) {
			if (err) throw err;  
			for(val in result[0]['value']) {
				totalused = totalused + parseFloat(val);
			}
			var sql = mysql.format("INSERT INTO powertotal (powerin,powerout,datetimeid) VALUES (?)", [totalgenerated, totalused, dateid]);
			con.query(sql, function (err, result) {
				if (err) throw err;
				console.log("Total power inserted");
			});
		});
	});
}

//Updates values in db. That is, generates new values and inserts them accordingly.
function update() {
	var location = "Kiruna";
	var nowDate = new Date(); 
	var date = nowDate.getFullYear()+'-'+(nowDate.getMonth()+1)+'-'+nowDate.getDate(); 
	var dateid = generateDate();
	createLocation(location);
	generateTemperature(location);
	generateWindForDay(location,date);
	generateWindForTime(location,date,dateid);
	var sqlHousehold = "SELECT id FROM household";
	con.query(sqlHousehold, function (err, result) {
		for(house in result[0]['id']) {
			generatePowerForTime(house,dateid);
			generatePowerUsageForTime(house,dateid);
		}
	});
	generatePowerTotal(dateid);
	// var totalarr = getPowerTotal(dateid);
	// var totalin = totalarr[0];
	// var totalout = totalarr[1];
	var sqlCountHousehold = "SELECT COUNT(id) FROM household";
	con.query(sqlCountHousehold, function (err, result) {
		var sqlHousehold = "SELECT id FROM household";
		var totalhouseholds = result[0]['COUNT(id)'];
		var sqlPowerTotal = mysql.format("SELECT powerin,powerout FROM powertotal WHERE datetimeid=?", [dateid]);
		con.query(sqlPowerTotal, function (err, result) {
			if (err) throw err;
			var totalin = result[0]['powerin'];
			var totalout = result[0]['powerout'];
			con.query(sqlHousehold, function (err, result) {
				for(house in result[0]['id']) {
					generatePowerCost(house, dateid,totalin,totalout,totalhouseholds);
				}
			});
		});
	});
}

con.connect(function(err) {
	if (err) throw err;
	console.log("Connected to db");
	update();
	//var location = "Kiruna";
	//createLocation(location);
	//var temp = generateDate();
	//console.log(temp);
});

//con.end(function(err) {
//	if (err) throw err;
//	console.log("Disconnected from db");
//});
