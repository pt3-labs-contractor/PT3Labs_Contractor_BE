const { Client } = require('pg');

module.exports = {
    connect,
    disconnect,
    select,
}

const client = new Client();

async function connect(){
    try {
        await client.connect();
    } catch(err) {
        console.log(err);
    }
}

async function disconnect(){
    try {
        await client.end();
    } catch(err) {
        console.log(err);
    }
}

async function query(str){
    return await client.query(str);
}