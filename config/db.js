const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',        
    password: '',        
    database: 'db_bengkel'   
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Terhubung ke database!');
});

module.exports = connection;
