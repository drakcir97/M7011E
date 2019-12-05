USE serverdb;

CREATE TABLE IF NOT EXISTS user (
    id int NOT NULL AUTO_INCREMENT,
    name char(255) NOT NULL,
    email char(255) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS passwords (
    id int NOT NULL AUTO_INCREMENT,
    userid int NOT NULL UNIQUE,
    salt char(255),
    pw char(255),
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES user(id)
);