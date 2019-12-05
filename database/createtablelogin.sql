USE serverdb;

CREATE TABLE IF NOT EXISTS user (
    id int NOT NULL AUTO_INCREMENET,
    name char(255) NOT NULL,
    email char(255) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS passwords (
    id int NOT NULL AUTO_INCREMENET,
    userid int NOT NULL UNIQUE,
    pw char(255),
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES user(id)
);