var express = require('express');
var app = express();
var db = require('../db/mydb');
var UserController = require('../controllers/UserController');
app.use('/users', UserController);
module.exports = app;
//An app.js for configuring the application