module.exports = {
    simulatorvar: {
        apartmentPower: 300, //Average power used by an apartment.
        housePower: 2500, //Average power used by house.
        tempMinAffect: 25, //At this value no power goes to heat.
        tempMaxAffect: -30, //At this value maximum power goes to heat.
        tempAffect: 2, //Maximum affect temperature has.
        tempCoefficient: 0.6, //Procentage that is affected by temperature.
        powerCostHigh: 0.01, //Cost if powerplant
        powerCostLow: 0.005 //Cost if wind
    },
    database: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'miri'
    },
};