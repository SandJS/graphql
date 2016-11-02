"use strict";

const SandGrain = require('sand-grain');
const _ = require('lodash');
const path = require('path');

const fs = require('fs');
const graphqlHTTP  = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools');



class GraphQL extends SandGrain {
  constructor() {
    super();
    this.name = this.configName = 'graphql';
    this.defaultConfig = require('./defaultConfig');
    this.version = require('../package').version;
  }

  init(config, done) {
    super.init(config);

    if (!sand.http) {
      throw new Error('sand-http is required to run graphql');
    }

    // Currently to do this, graphql needs to load before http
    sand.http.on('router:before',this.registerMiddleware.bind(this));

    done();
  }

  registerMiddleware() {
    let schemas = this.loadSchemas();
    let resolvers = this.loadResolvers();

    let options = {
      typeDefs: [schemas],
      resolvers: resolvers,
    };

    if (this.config.useSandLogger) {
      options.logger = { log: this.error };
    }

    this.schema = makeExecutableSchema(options);

    sand.http.app.use(this.config.route, (req, res) => {
      let ctx = new sand.http.exports.Context(req, res);

      if ('function' === typeof this.config.prepareContext) {
        this.config.prepareContext(ctx);
      }

      graphqlHTTP({
        schema: this.schema,
        rootValue: this.config.rootValue,
        graphiql: this.config.graphiql,
        context: ctx,
      })(req, res);
    });
  }

  loadSchemas() {
    const readDir = (dir) => {
      let schemas = '';
      let files = fs.readdirSync(dir);
      for (let file of files) {
        file = path.resolve(dir, file);

        let stat = fs.statSync(file);
        if (stat.isDirectory()) {
          schemas += readDir(file);
        } else if (stat.isFile()) {
          if (path.extname(file) == this.config.schemaExtension) {
            schemas += fs.readFileSync(file);
          }
        }
      }

      return schemas;
    };

    return readDir(path.normalize(sand.appPath + this.config.schemasDir));
  }

  loadResolvers() {
    return require('require-all')({
      dirname: path.normalize(sand.appPath + this.config.resolversDir),
      recursive: true
    });
  }
}

module.exports = GraphQL;

/**
 * Just returns the template string the same way entered.
 *
 * This is used for code highlighters like WebStorm
 * and the GraphQL plugin
 *
 * @param strings
 * @param substitutions
 *
 * @return {string}
 */
GraphQL.gql = function gql(strings, ...substitutions) {
  let result = '';

  for  (let i = 0; i < substitutions.length; i++) {
    result += strings[i];
    result += substitutions[i];
  }

  result += strings[strings.length - 1];

  return result;
};