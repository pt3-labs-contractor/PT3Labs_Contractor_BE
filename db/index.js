const { Pool } = require('pg');

module.exports = {
  query: function(text, values, cb) {
    const pg = new Pool();
    pg.connect(function(err, client, done) {
      client.query(text, values, function(err, result) {
        done();
        cb(err, result);
      });
    });
  },
};
