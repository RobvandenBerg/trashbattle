var mysql      = require('mysql');

var conn_conf= {
    host     : 'localhost',
    port     :3306,
    user     : 'trashbattleuser',
    password : 'horseduckgoosesquirrel',
    database: 'trashbattle'
}

var connection = mysql.createConnection(conn_conf);

connection.connect(function(err) {
    if(err) console.log("Could not connect to DB");
    else{
        console.log("Connected to "+conn_conf.database+' on '+conn_conf.host );
    }
});


connection.query( 'SELECT * FROM trashbattle.users ', function(err, rows) {
            console.log("SELECT * FROM mytable ");

            for(var i=0; i<rows.length; i++){
                console.log(rows[i]);
            }

            return rows;

    });

connection.end();