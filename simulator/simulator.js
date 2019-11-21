
const express = require('express')
const app = express()

var randomNormal = require('random-normal')
var mysql = require('mysql');

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

function setValues(){
	//get windspeed from database put it where 'windSpeedCurrentTime' is
//	var curWind = randomNormal({mean: getPreviousvaluefromdatabase, st: });
	var elePro = ((1.3968**windSpeedCurrentTime)*56.94).toFixed(3);
        var eleConApart = randomNormal({mean: 1.25, dev: 0.35});
        var eleConHouse = randomNormal({mean: 2.25, dev: 0.35});
        request({
                url: 'https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/159880/period/latest-hour/data.json',
                json: true
                }, function(error, response, body) {
                var test = body;
                var objVal = test.value;
                var objName = test.station.name;
                var objTemp = JSON.stringify(objVal[0].value);
                res.send("this is the temperature in "+" "+objName+" "+objTemp+" right now");
        });

}

function generateWindForLocation(location){
	createLocation(location);
	var sqlLocation = mysql.format("SELECT id FROM location WHERE name=?", [location]);
	con.query(sqlLocation, function (err, result) {
                if (err) throw err;
		var meanWind = getNormValues(7, 2);
		var nowDate = new Date(); 
		var date = nowDate.getFullYear()+'-'+(nowDate.getMonth()+1)+'-'+nowDate.getDate(); 
		var locationId = result[0]['id'];
        	var sql = mysql.format("INSERT INTO averagewindspeed (locationid, windspeed, dt) VALUES (?,?,?)", [locationId, meanWind, date]);
        	con.query(sql, function (err2, result) {
                	if (err2) throw err2;
                	console.log("1 record inserted");
        	});
	});
}

function createLocation(location){
	var sql = mysql.format("SELECT COUNT(*) FROM location WHERE name=?", [location]);  
        con.query(sql, function (err, result) {
            	if (err) throw err;           
		console.log("location was found");
		var count = result[0]['COUNT(*)'];
		if (count == 0) {
                	var sql = mysql.format("INSERT INTO location (name) VALUES (?)", [location]);
			console.log("after");
                	con.query(sql, function(err2, result) {
                        	if (err2) throw err2;
                        	console.log("Location not found, was inserted");
                	});
		}
       	});
}

con.connect(function(err) {
	if (err) throw err;
	console.log("Connected to db");
	generateWindForLocation("Kiruna");
});

//con.end(function(err) {
//	if (err) throw err;
//	console.log("Disconnected from db");
//});
