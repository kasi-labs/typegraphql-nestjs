import {Resolver, FieldResolver, Query} from "type-graphql";

import Review from "./review";
import { reviews } from "./data";

@Resolver(of => Review)
export default class ReviewsResolver {

  @Query(returns => [Review])
  async reviews(): Promise<Review[]> {
    return reviews;
  }
}
