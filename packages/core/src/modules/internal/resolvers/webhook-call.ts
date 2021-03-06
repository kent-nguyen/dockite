import { WebhookCall } from '@dockite/database';
import {
  Arg,
  Field as GraphQLField,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { getRepository } from 'typeorm';

import { Authenticated, Authorized } from '../../../common/decorators';

@ObjectType()
class ManyWebhookCalls {
  @GraphQLField(_type => [WebhookCall])
  results!: WebhookCall[];

  @GraphQLField(_type => Int)
  totalItems!: number;

  @GraphQLField(_type => Int)
  currentPage!: number;

  @GraphQLField(_type => Int)
  totalPages!: number;

  @GraphQLField(_type => Boolean)
  hasNextPage!: boolean;
}

@Resolver(_of => WebhookCall)
export class WebhookCallResolver {
  @Authenticated()
  @Authorized('internal:webhook:read', { derriveAlternativeScopes: false })
  @Query(_returns => WebhookCall, { nullable: true })
  async getWebhookCall(@Arg('id') id: string): Promise<WebhookCall | null> {
    const repository = getRepository(WebhookCall);

    const webhookCall = await repository.findOne({ where: { id } });

    return webhookCall ?? null;
  }


  @Authenticated()
  @Authorized('internal:webhook:read', { derriveAlternativeScopes: false })
  @Query(_returns => ManyWebhookCalls)
  async allWebhookCalls(
    @Arg('page', _type => Int, { defaultValue: 1 })
    page: number,
    @Arg('perPage', _type => Int, { defaultValue: 20 })
    perPage: number,
  ): Promise<ManyWebhookCalls> {
    const repository = getRepository(WebhookCall);

    const [results, totalItems] = await repository.findAndCount({
      take: perPage,
      skip: perPage * (page - 1),
      order: { executedAt: 'DESC' },
    });

    const totalPages = Math.ceil(totalItems / perPage);

    return {
      results,
      totalItems,
      currentPage: page,
      hasNextPage: page < totalPages,
      totalPages,
    };
  }

  @Authenticated()
  @Authorized('internal:webhook:read', { derriveAlternativeScopes: false })
  @Query(_returns => ManyWebhookCalls)
  async findWebhookCalls(
    @Arg('page', _type => Int, { defaultValue: 1 })
    page: number,
    @Arg('perPage', _type => Int, { defaultValue: 20 })
    perPage: number,
    @Arg('webhookId', _type => String)
    webhookId: string,
  ): Promise<ManyWebhookCalls> {
    const repository = getRepository(WebhookCall);

    const [results, totalItems] = await repository.findAndCount({
      where: { webhookId },
      take: perPage,
      skip: perPage * (page - 1),
      order: { executedAt: 'DESC' },
    });

    const totalPages = Math.ceil(totalItems / perPage);

    return {
      results,
      totalItems,
      currentPage: page,
      hasNextPage: page < totalPages,
      totalPages,
    };
  }

  @Authenticated()
  @Authorized('internal:webhook:delete', { derriveAlternativeScopes: false })
  @Mutation(_returns => Boolean)
  async removeWebhookCall(@Arg('id') id: string): Promise<boolean> {
    const repository = getRepository(WebhookCall);

    try {
      const webhookCall = await repository.findOneOrFail({ where: { id } });

      await repository.remove(webhookCall);

      return true;
    } catch {
      return false;
    }
  }
}
