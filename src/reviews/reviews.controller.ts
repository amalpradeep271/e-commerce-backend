import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { AddReviewDto } from './dto/add-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a new product review' })
  @ApiResponse({ status: 201, description: 'Review Added successfully' })
  async addReview(@CurrentUser() user: any, @Body() addReviewDto: AddReviewDto) {
    return this.reviewsService.addReview(user.id, addReviewDto);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiResponse({ status: 200, description: 'Returns reviews list' })
  async getAllReviews(@Param('productId') productId: string) {
    return this.reviewsService.getAllReviews(productId);
  }
}
