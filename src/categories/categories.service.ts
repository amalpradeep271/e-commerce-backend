import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { categoryTable } from '../db/schema';

@Injectable()
export class CategoriesService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getCategories() {
    const categories = await this.drizzleService.db
      .select()
      .from(categoryTable)
      .execute();

    return categories.map((cat) => ({
      categoryId: cat.id, // Maps 1:1 to categoryId field on Flutter frontend
      title: cat.title,
      image: cat.image,
    }));
  }
}
