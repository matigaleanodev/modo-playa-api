import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    // TODO: OWNER VIENE DEL JWT
    const ownerId = 'OWNER_ID_PLACEHOLDER';

    return this.usersService.createUser(ownerId, createUserDto);
  }

  @Get()
  async findAll() {
    // TODO: OWNER VIENE DEL JWT
    const ownerId = 'OWNER_ID_PLACEHOLDER';

    return this.usersService.findAllByOwner(ownerId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    // TODO: OWNER VIENE DEL JWT
    const ownerId = 'OWNER_ID_PLACEHOLDER';

    return this.usersService.findById(ownerId, id);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // TODO: OWNER VIENE DEL JWT
    const ownerId = 'OWNER_ID_PLACEHOLDER';

    return this.usersService.updateUser(ownerId, id, updateUserDto);
  }
}
