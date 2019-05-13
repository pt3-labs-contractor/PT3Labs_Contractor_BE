const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLSchema,
} = require('graphql');
const { query } = require('../db');
const bcrypt = require('bcrypt');

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

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addContractor: {
      type: ContractorType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        phone_number: { type: new GraphQLNonNull(GraphQLString) },
        street_address: { type: new GraphQLNonNull(GraphQLString) },
        city: { type: new GraphQLNonNull(GraphQLString) },
        state_abbr: { type: new GraphQLNonNull(GraphQLString) },
        zip_code: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parent, args) {
        return query(
          `INSERT INTO contractors (name, phone_number, street_address, city, state_abbr, zip_code)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, name, phone_number, street_address, city, state_abbr, zip_code, created_at;`,
          [
            args.name,
            args.phone_number,
            args.street_address,
            args.city,
            args.state_abbr,
            args.zip_code,
          ]
        )
          .then(res => res.rows[0])
          .catch(err => {
            throw new Error(err);
          });
      },
    },
    addUser: {
      type: UserType,
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        contractor_id: { type: GraphQLID },
      },
      resolve(parent, args) {
        const hash = bcrypt.hashSync(args.password, 12);
        return query(
          `INSERT INTO users (username, password, email, contractor_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id, username, email, contractor_id, created_at;
          `,
          [args.username, hash, args.email, args.contractor_id]
        )
          .then(res => res.rows[0])
          .catch(err => {
            throw new Error(err);
          });
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation,
});
