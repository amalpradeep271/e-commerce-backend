import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all addresses of logged-in user' })
  @ApiResponse({ status: 200, description: 'Returns address list' })
  async getAddresses(@CurrentUser() user: any) {
    return this.addressesService.getAddresses(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new address' })
  @ApiResponse({ status: 201, description: 'Returns created address' })
  async createAddress(
    @CurrentUser() user: any,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressesService.createAddress(user.id, createAddressDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing address' })
  @ApiResponse({ status: 200, description: 'Returns updated address' })
  async updateAddress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(user.id, id, updateAddressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted status' })
  async deleteAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.addressesService.deleteAddress(user.id, id);
  }
}
