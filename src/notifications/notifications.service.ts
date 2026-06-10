import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { notificationTable } from '../db/schema';
import { eq, or, isNull, and } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getNotifications(userId: string, tenantId: string) {
    return this.drizzleService.db
      .select()
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.tenantId, tenantId),
          or(
            eq(notificationTable.userId, userId),
            isNull(notificationTable.userId),
          ),
        ),
      )
      .orderBy(notificationTable.createdAt)
      .execute();
  }

  async markAsRead(userId: string, notificationId: string) {
    const [notification] = await this.drizzleService.db
      .select()
      .from(notificationTable)
      .where(eq(notificationTable.id, notificationId))
      .execute();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== null && notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    const [updated] = await this.drizzleService.db
      .update(notificationTable)
      .set({ isRead: true })
      .where(eq(notificationTable.id, notificationId))
      .returning()
      .execute();

    return updated;
  }
}
