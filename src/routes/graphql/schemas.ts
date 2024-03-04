import { Type } from '@fastify/type-provider-typebox';
import { GraphQLObjectType, GraphQLString } from 'graphql';

export const gqlResponseSchema = Type.Partial(
  Type.Object({
    data: Type.Any(),
    errors: Type.Any(),
  }),
);

export const createGqlResponseSchema = {
  body: Type.Object(
    {
      query: Type.String(),
      variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
    },
    {
      additionalProperties: false,
    },
  ),
};

export const query = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    hello: {
      type: GraphQLString,
      args: {
        name: { type: GraphQLString },
      },
      resolve: (parent, args) => `Hello, ${args.name}!`,
    },
  }),
});

export const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    setName: {
      type: GraphQLString,
      args: {
        name: { type: GraphQLString },
      },
      resolve: (parent, args) => `Set name to: ${args.name}`,
    },
  }),
});
