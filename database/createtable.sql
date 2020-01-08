USE miri;

CREATE TABLE IF NOT EXISTS location (
    id int NOT NULL AUTO_INCREMENT,
    name char(255) UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS household (
	id int NOT NULL AUTO_INCREMENT,
	locationid int NOT NULL,
	housetype char(255),
	PRIMARY KEY (id),
	FOREIGN KEY (locationid) REFERENCES location(id)
);

CREATE TABLE IF NOT EXISTS user (
    id int NOT NULL AUTO_INCREMENT,
    householdid int NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (householdid) REFERENCES household(id)
);

CREATE TABLE IF NOT EXISTS datet (
    id int NOT NULL AUTO_INCREMENT,
    dt datetime NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS averagewindspeed (
    i int NOT NULL AUTO_INCREMENT,
	locationid int NOT NULL,
	windspeed float NOT NULL,
	dt date NOT NULL UNIQUE,
	PRIMARY KEY (i),
	FOREIGN KEY (locationid) REFERENCES location(id)
);

CREATE TABLE IF NOT EXISTS windspeed (
	i int NOT NULL AUTO_INCREMENT,
	locationid int NOT NULL,
	windspeed float NOT NULL,
	datetimeid int NOT NULL,
	PRIMARY KEY (i),
	FOREIGN KEY (locationid) REFERENCES location(id),
	FOREIGN KEY (datetimeid) REFERENCES datet(id)
);

CREATE TABLE IF NOT EXISTS temperature (
	i int NOT NULL AUTO_INCREMENT,
	locationid int NOT NULL,
	temperature float NOT NULL,
	datetimeid int NOT NULL,
	PRIMARY KEY (i),
	FOREIGN KEY (locationid) REFERENCES location(id),
	FOREIGN KEY (datetimeid) REFERENCES datet(id)
);

CREATE TABLE IF NOT EXISTS powerusage (
	i int NOT NULL AUTO_INCREMENT,
	householdid int NOT NULL,
	value float NOT NULL,
	datetimeid int NOT NULL,
	PRIMARY KEY (i),
	FOREIGN KEY (householdid) REFERENCES household(id),
	FOREIGN KEY (datetimeid) REFERENCES datet(id)
);

CREATE TABLE IF NOT EXISTS powergenerated (
	i int NOT NULL AUTO_INCREMENT,
	householdid int NOT NULL,
	value float NOT NULL,
	datetimeid int NOT NULL,
	PRIMARY KEY (i),
	FOREIGN KEY (householdid) REFERENCES household(id),
	FOREIGN KEY (datetimeid) REFERENCES datet(id)
);

CREATE TABLE IF NOT EXISTS powerstored (
	i int NOT NULL AUTO_INCREMENT,
	householdid int NOT NULL UNIQUE,
	value float NOT NULL,
	PRIMARY KEY (i),
	FOREIGN KEY (householdid) REFERENCES household(id)
);

CREATE TABLE IF NOT EXISTS powertotal (
	i int NOT NULL AUTO_INCREMENT,
	powerin float NOT NULL,
	powerout float NOT NULL,
	datetimeid int NOT NULL,
	PRIMARY KEY (i),
	FOREIGN KEY (datetimeid) REFERENCES datet(id)
);

CREATE TABLE IF NOT EXISTS powercosthousehold (
	i int NOT NULL AUTO_INCREMENT,
	householdid int NOT NULL,
	value float NOT NULL,
	datetimeid int NOT NULL,
	PRIMARY KEY (i),
	FOREIGN KEY (householdid) REFERENCES household(id),
	FOREIGN KEY (datetimeid) REFERENCES datet(id)
);

CREATE TABLE IF NOT EXISTS simulationsettings (
    id int NOT NULL AUTO_INCREMENT,
    userid int NOT NULL UNIQUE,
    ratiokeep float NOT NULL,
    ratiosell float NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES user(id)
);