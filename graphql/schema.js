const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLSchema,
} = require('graphql');
const { query } = require('../db');

const ContractorType = new GraphQLObjectType({
  name: 'Contractor',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    phone_number: { type: new GraphQLNonNull(GraphQLString) },
    street_address: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    state_abbr: { type: new GraphQLNonNull(GraphQLString) },
    zip_code: { type: new GraphQLNonNull(GraphQLString) },
    created_at: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    username: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    contractor_id: { type: GraphQLID },
    created_at: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: () => ({
    contractors: {
      type: new GraphQLList(ContractorType),
      resolve() {
        return query('SELECT * FROM contractors;')
          .then(res => res.rows)
          .catch(err => {
            throw new Error(err);
          });
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve() {
        return query(
          'SELECT id, username, email, contractor_id, created_at FROM users;'
        )
          .then(res => res.rows)
          .catch(err => {
            throw new Error(err);
          });
      },
    },
    contractor: {
      type: ContractorType,
      args: {
        id: { type: GraphQLString },
      },
      resolve(parent, args) {
        return query('SELECT * FROM contractors WHERE id = $1', [args.id])
          .then(res => res.rows[0])
          .catch(err => {
            throw new Error(err);
          });
      },
    },
    user: {
      type: UserType,
      args: {
        id: { type: GraphQLID },
      },
      resolve(parent, args) {
        return query(`SELECT * FROM users WHERE id = $1`, [args.id])
          .then(res => res.rows[0])
          .catch(err => {
            throw new Error(err);
          });
      },
    },
  }),
});

module.exports = new GraphQLSchema({
  query: RootQuery,
});
