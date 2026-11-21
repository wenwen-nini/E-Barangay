require("dotenv").config();

const pool = require("./config/database");

async function testDatabase() {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM User LIMIT 5"
        );

        console.log("SELECT query successful!");
        console.log("User records:");

        console.table(rows);

    } catch (error) {
        console.error("Database query failed:");
        console.error(error.message);

    } finally {
        await pool.end();
    }
}

testDatabase();