import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { userTable } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getProfile(userId: string) {
    const [user] = await this.drizzleService.db
      .select({
        userId: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
        image: userTable.image,
        role: userTable.role,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .execute();

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image ?? '',
      role: user.role,
    };
  }

  async updateAvatar(userId: string, imageUrl: string) {
    const [updatedUser] = await this.drizzleService.db
      .update(userTable)
      .set({ image: imageUrl })
      .where(eq(userTable.id, userId))
      .returning({ image: userTable.image })
      .execute();

    if (!updatedUser) {
      throw new NotFoundException('User not found to update profile picture');
    }

    return {
      imageUrl: updatedUser.image ?? '',
    };
  }
}
