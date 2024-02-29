import { GraphQLList, GraphQLResolveInfo } from 'graphql';
import { user } from '../../../types/user.js';
import { ContextValue } from '../../../types.js';
import {
  ResolveTree,
  parse,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';
import DataLoader from 'dataloader';
import { USERS_DL_KEY, USERS_DL_PRIME_KEY } from '../../../constants.js';

export const users = {
  type: new GraphQLList(user),
  async resolve(_source, _args, context: ContextValue, info: GraphQLResolveInfo) {
    const { fastify, dataLoaders } = context;
    const parsedResolveInfo = parse(info) as ResolveTree;

    const simpliffiedResolveInfo = simplifyParsedResolveInfoFragmentWithType(
      parsedResolveInfo,
      info.returnType,
    );

    const isWithSubscribers = 'subscribedToUser' in simpliffiedResolveInfo.fields;
    const isWithSubscriptions = 'userSubscribedTo' in simpliffiedResolveInfo.fields;

    const users = await fastify.prisma.user.findMany({
      include: {
        subscribedToUser: isWithSubscribers,
        userSubscribedTo: isWithSubscriptions,
      },
    });

    const ids = users.map((user) => user.id);

    let dl = dataLoaders.get(USERS_DL_KEY);

    if (!dl) {
      dl = new DataLoader(async (ids: readonly string[]) => {
        const sortedUsersInIdsOrder = ids.map((id) =>
          users.find((user) => user.id === id),
        );

        return sortedUsersInIdsOrder;
      });
      dataLoaders.set(USERS_DL_KEY, dl);
    }

    dl.prime(USERS_DL_PRIME_KEY, users);

    return dl.loadMany(ids);
  },
};
