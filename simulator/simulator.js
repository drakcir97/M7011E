
const express = require('express')
const app = express()

var randomNormal = require('random-normal')

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

}

