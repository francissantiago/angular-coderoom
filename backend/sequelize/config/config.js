require('dotenv').config();

module.exports = {
  development: {
    username: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'coderoom_db',
    host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql',
  },
  test: {
    username: 'root',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  production: {
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || null,
    database: process.env.MYSQL_DATABASE || 'coderoom_db',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    dialect: 'mysql',
  },
};
