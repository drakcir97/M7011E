var express = require('express');
var app = express();

app.get('/', function (req, res) {

    var mysql = require("mysql");

    // config for your database
    var config = {
        user: 'root',
        password: '',
        server: 'localhost',
        database: 'miri'
    };

    // connect to your database
    var con = mysql.createConnection(config);

    con.connect(function(err) {

        if (err) console.log(err);

        // create Request object
        //var request = new mysql.Request();

        // query to the database and get the records
        con.query('select * from test', function (err, recordset) {

            if (err) console.log(err)

            // send records as a response
            res.send(recordset);

        });
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));
