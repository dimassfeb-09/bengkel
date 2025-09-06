const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'ghilman',        
    password: 'AA11BB2209!1',        
    database: 'db_bengkel'   
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Terhubung ke database!');
});

module.exports = connection;
