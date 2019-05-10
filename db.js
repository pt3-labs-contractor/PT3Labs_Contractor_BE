const { Client } = require('pg');

module.exports = {
    handleDBConnect,
}

async function handleDBConnect(){
    try {
        const client = new Client();
        await client.connect();
        const res = await client.query('SELECT $1::text as message', ['Hello World']);
        console.log(res.rows[0].message);
        await client.end();
    } catch(err) {
        console.log(err);
    }
}