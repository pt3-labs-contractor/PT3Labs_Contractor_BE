const express = require('express');
const cors = require('cors');
const graphqlHTTP = require('express-graphql');
const schema = require('./schema');

const app = express();
app.use(cors());

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}.`));
