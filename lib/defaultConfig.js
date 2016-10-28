module.exports = {
  route: '/graphql',
  resolversDir: '/graphql/resolvers',
  schemasDir: '/graphql/schemas',
  graphiql: process.env.NODE_ENV == 'development',
  useSandLogger: true,
  schemaExtension: '.graphqls',
  rootValue: {},
  prepareContext: null
};