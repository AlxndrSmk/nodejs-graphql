import { GraphQLResolveInfo } from 'graphql';
import {
  ResolveTree,
  parse,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';
import DataLoader from 'dataloader';
import { ContextValue } from '../../../types/types.js';

export const users = {
  async resolve(
    _source,
    _args,
    context: ContextValue,
    info: GraphQLResolveInfo,
  ): Promise<any> {
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

    let dl = dataLoaders.get({ id: 'usersDl' } as const);

    if (!dl) {
      dl = new DataLoader(async (ids: readonly string[]) => {
        const sortedUsersInIdsOrder = ids.map((id) =>
          users.find((user) => user.id === id),
        );

        return sortedUsersInIdsOrder;
      });
      dataLoaders.set({ id: 'usersDl' } as const, dl);
    }

    dl.prime('users', users);

    return dl.loadMany(ids);
  },
};
