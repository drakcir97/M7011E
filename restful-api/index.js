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
 
//show all users
app.get('/api/users',(req, res) => {
    let sql = "SELECT household.id,household.locationid,household.housetype,powerusage.value,powergenerated.value FROM household INNER JOIN powerusage ON household.id=powerusage.householdid INNER JOIN powergenerated ON household.id=powergenerated.householdid";
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
});
 
//show single user
app.get('/api/users/:id',(req, res) => {
    let sql = "SELECT household.id,household.locationid,household.housetype,powerusage.value,powergenerated.value FROM household INNER JOIN powerusage ON household.id=powerusage.householdid INNER JOIN powergenerated ON household.id=powergenerated.householdid WHERE household.id="+req.params.id;
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
});

//show windspeed & temperature
app.get('/api/weather',(req, res) => {
    let sql = "SELECT temperature.temperature, windspeed.windspeed, temperature.datetimeid FROM temperature INNER JOIN windspeed ON temperature.datetimeid=windspeed.locationid";
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
});
 
//show current electricity price
app.get('/api/electricityprice',(req, res) => {
    let sql = "SELECT householdid, value, datetimeid FROM powercosthousehold";
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
});

//show current electricity price type 2
app.get('/api/electricityprice2',(req, res) => {
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
        res.send(JSON.stringify({"status": 200, "error": null, "response": powercost}));
    });
});

//shows current electricity consumtion.
app.get('/api/electricityconsumtion',(req, res) => {
    let sql = "SELECT powerout, datetimeid FROM powertotal";
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
});
  
//add new product
app.post('/api/products',(req, res) => {
    let data = {product_name: req.body.product_name, product_price: req.body.product_price};
    let sql = "INSERT INTO product SET ?";
    let query = conn.query(sql, data,(err, results) => {
        if(err) throw err;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
});
 
//update product
app.put('/api/products/:id',(req, res) => {
    let sql = "UPDATE product SET product_name='"+req.body.product_name+"', product_price='"+req.body.product_price+"' WHERE product_id="+req.params.id;
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
});
 
//Delete product
app.delete('/api/products/:id',(req, res) => {
    let sql = "DELETE FROM product WHERE product_id="+req.params.id+"";
    let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    });
});
 
//Server listening
app.listen(3000,() =>{
    console.log('Server started on port 3000...');
});
//http://35.173.230.193:3000/api/electricityconsumtion