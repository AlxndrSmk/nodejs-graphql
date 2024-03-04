import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  createGqlResponseSchema,
  gqlResponseSchema,
  mutation,
  query,
} from './schemas.js';
import { GraphQLSchema, parse, validate } from 'graphql';
import depthLimit from 'graphql-depth-limit';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const schema = new GraphQLSchema({ query, mutation });
      const ast = parse(req.body.query);
      const validation = validate(schema, ast, [depthLimit(5)]);

      if (validation.length) return { errors: validation };
    },
  });
};

export default plugin;
