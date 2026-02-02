const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "ainsley",
  password: "baby0806",
  database: "recycle_app",
  port: 5432,
});

module.exports = pool;
