var mysql = require('mysql');

const fs = require('fs');

var dbInfo;
try {
  dbInfo = JSON.parse(fs.readFileSync(__dirname + '/../../database_info.json', 'utf8'));
} catch (err) {
  console.error(err);
}

// This module enables MySQL queries


// The MySQL database info
var conn_conf = {
    host     : dbInfo.host,
    port     : dbInfo.port,
    user     : dbInfo.user,
    password : dbInfo.password,
    database : dbInfo.db
}



var mysql_query = function(query, errorFunction, useResults, resultfunction)
{
	// This function establishes a MySQL connection, executes a query, and afterwards closes the connection again
	// PARAMETERS:
	// query: The MySQL query to be executed
	// errorFunction (optional): The function to be executed in case of an errorFunction
	// useResults (optional): If this is set to true, the resultfunction will be executed (see next line)
	// resultfunction (optional): if useResults is set to true, this function will be executed after the query has been executed
	// 					If the MySQL query was a SELECT, the results will be passed as an argument to this function
	
	
	
	// Create the connection
	var connection = mysql.createConnection(conn_conf);

	// Actually connect to the DB
	connection.connect(function(err) {
		if(err) console.log("Could not connect to DB");
		else{
			console.log("Connected to "+conn_conf.database+' on '+conn_conf.host );
		}
	});
	
	// Execute the query
	connection.query( query, function(err, rows) {
			console.log('Executed query: ' + query);
			if(err)
			{
				console.log('Error(1): ' + err);
				if(errorFunction)
				{
					errorFunction();
				}
			}
			if(useResults)
			{
				resultfunction(rows);
			}

    });
	
	// Close the connection
	connection.end();
}

module.exports = mysql_query;