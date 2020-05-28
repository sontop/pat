const express = require('express');
const router = express.Router();
const mysql_odbc = require('../db/db_conn')();
const conn = mysql_odbc.init();

router.get('/list/:page', function(req, res, next){
    let page = req.params.page;
    let sql = "select index, name, title, con"
});

module.exports - router;