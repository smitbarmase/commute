import { Resolver, Query, Arg, Int, Field, ObjectType, Ctx } from 'type-graphql';
import { getConnection } from 'typeorm';

import { Follow } from '../../../entities/follow';
import { context } from '../../../types';

@ObjectType()
class PaginatedFollowing {
  @Field(() => [Follow])
  result: Follow[];
  @Field()
  hasMore: boolean;
}

@Resolver()
export class FollowingResolver {
  @Query(() => PaginatedFollowing)
  async following(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: context
  ): Promise<PaginatedFollowing> {
    limit = Math.min(50, limit);
    const qb = getConnection()
      .getRepository(Follow)
      .createQueryBuilder("follow")
      .leftJoinAndSelect("follow.user", "user")
      .where("follow.follower.id = :id", { id: req.session.userId })
      .orderBy("follow.createdAt", "DESC")
      .take(limit + 1);

    if (cursor) {
      qb.andWhere("follow.createdAt < :cursor", {
        cursor: new Date(parseInt(cursor))
      });
    }

    let result = await qb.getMany();

    let hasMore = false;

    if (result.length > limit) {
      hasMore = true;
      result.pop();
    }

    return { result, hasMore };
  }
}