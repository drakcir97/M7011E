USE serverdb;

CREATE TABLE IF NOT EXISTS user (
    id int NOT NULL AUTO_INCREMENT,
    name char(255) NOT NULL,
    email char(255) NOT NULL UNIQUE,
    admin boolean NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS simulationsettings (
    id int NOT NULL AUTO_INCREMENT,
    userid int NOT NULL UNIQUE,
    ratiokeep float DEFAULT '0.5',
    ratiosell float DEFAULT '0.5',
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS passwords (
    id int NOT NULL AUTO_INCREMENT,
    userid int NOT NULL UNIQUE,
    salt char(255),
    pw char(255),
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS picture (
    id int NOT NULL AUTO_INCREMENT,
    userid int NOT NULL UNIQUE,
    picture MEDIUMBLOB NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS token (
    id int NOT NULL AUTO_INCREMENT,
    userid int UNIQUE,
    token MEDIUMBLOB,
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS log (
    id int NOT NULL AUTO_INCREMENT,
    userid int NOT NULL,
    dt datetime NOT NULL,
    ip char(255),
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES user(id)
);