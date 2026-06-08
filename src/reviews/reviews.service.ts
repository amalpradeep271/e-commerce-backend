import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { reviewTable, productTable, userTable } from '../db/schema';
import { AddReviewDto } from './dto/add-review.dto';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class ReviewsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async addReview(userId: string, addReviewDto: AddReviewDto) {
    const { productId, rating, reviewTitle, reviewContent } = addReviewDto;

    // 1. Resolve internal database product ID
    const [product] = await this.drizzleService.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.productId, productId))
      .execute();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Insert review
    await this.drizzleService.db
      .insert(reviewTable)
      .values({
        userId,
        productId: product.id,
        title: reviewTitle,
        content: reviewContent,
        rating: rating.toString(),
      })
      .execute();

    return {
      message: 'Review Added successfully',
    };
  }

  async getAllReviews(productId: string) {
    // 1. Resolve internal product ID
    const [product] = await this.drizzleService.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.productId, productId))
      .execute();

    if (!product) {
      return [];
    }

    // 2. Get reviews with user profiles
    const reviews = await this.drizzleService.db
      .select({
        reviewId: reviewTable.id,
        rating: reviewTable.rating,
        title: reviewTable.title,
        content: reviewTable.content,
        createdAt: reviewTable.createdAt,
        user: {
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          image: userTable.image,
        },
      })
      .from(reviewTable)
      .innerJoin(userTable, eq(reviewTable.userId, userTable.id))
      .where(eq(reviewTable.productId, product.id))
      .orderBy(desc(reviewTable.createdAt))
      .execute();

    // 3. Map to match the expected client JSON keys
    return reviews.map((item) => ({
      creatorName: `${item.user.firstName} ${item.user.lastName}`,
      creatorImage: item.user.image ?? '',
      productId: productId, // client custom string ID
      rating: Number(item.rating),
      reviewContent: item.content ?? '',
      reviewTitle: item.title ?? '',
      createdDate: item.createdAt.toISOString(),
    }));
  }
}
