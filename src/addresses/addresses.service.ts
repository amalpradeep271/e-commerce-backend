import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../db/db.service';
import { addressTable } from '../db/schema';
import { eq, and, not } from 'drizzle-orm';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getAddresses(userId: string) {
    return this.drizzleService.db
      .select()
      .from(addressTable)
      .where(eq(addressTable.userId, userId))
      .execute();
  }

  async createAddress(userId: string, createAddressDto: CreateAddressDto) {
    const isDefault = createAddressDto.isDefault || false;

    return this.drizzleService.db.transaction(async (tx) => {
      if (isDefault) {
        await tx
          .update(addressTable)
          .set({ isDefault: false })
          .where(eq(addressTable.userId, userId))
          .execute();
      } else {
        const existing = await tx
          .select({ id: addressTable.id })
          .from(addressTable)
          .where(eq(addressTable.userId, userId))
          .execute();
        if (existing.length === 0) {
          createAddressDto.isDefault = true;
        }
      }

      const [newAddress] = await tx
        .insert(addressTable)
        .values({
          userId,
          label: createAddressDto.label,
          fullName: createAddressDto.fullName,
          phone: createAddressDto.phone,
          addressLine1: createAddressDto.addressLine1,
          addressLine2: createAddressDto.addressLine2,
          city: createAddressDto.city,
          state: createAddressDto.state,
          pinCode: createAddressDto.pinCode,
          isDefault: createAddressDto.isDefault ?? false,
        })
        .returning()
        .execute();

      return newAddress;
    });
  }

  async updateAddress(userId: string, addressId: string, updateAddressDto: UpdateAddressDto) {
    return this.drizzleService.db.transaction(async (tx) => {
      const [existingAddress] = await tx
        .select()
        .from(addressTable)
        .where(and(eq(addressTable.id, addressId), eq(addressTable.userId, userId)))
        .execute();

      if (!existingAddress) {
        throw new NotFoundException('Address not found');
      }

      if (updateAddressDto.isDefault) {
        await tx
          .update(addressTable)
          .set({ isDefault: false })
          .where(and(eq(addressTable.userId, userId), not(eq(addressTable.id, addressId))))
          .execute();
      }

      const [updatedAddress] = await tx
        .update(addressTable)
        .set({
          ...updateAddressDto,
          userId: undefined,
          id: undefined,
        } as any)
        .where(eq(addressTable.id, addressId))
        .returning()
        .execute();

      return updatedAddress;
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    return this.drizzleService.db.transaction(async (tx) => {
      const [existingAddress] = await tx
        .select()
        .from(addressTable)
        .where(and(eq(addressTable.id, addressId), eq(addressTable.userId, userId)))
        .execute();

      if (!existingAddress) {
        throw new NotFoundException('Address not found');
      }

      await tx
        .delete(addressTable)
        .where(eq(addressTable.id, addressId))
        .execute();

      if (existingAddress.isDefault) {
        const [nextAddress] = await tx
          .select()
          .from(addressTable)
          .where(eq(addressTable.userId, userId))
          .limit(1)
          .execute();

        if (nextAddress) {
          await tx
            .update(addressTable)
            .set({ isDefault: true })
            .where(eq(addressTable.id, nextAddress.id))
            .execute();
        }
      }

      return { message: 'Address deleted successfully' };
    });
  }
}
