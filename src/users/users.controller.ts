import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { Request } from 'express';
import {
  ApiCreateUserDoc,
  ApiFindAllUsersDoc,
  ApiFindUserByIdDoc,
  ApiUpdateUserDoc,
  ApiUsersController,
} from './users.swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersMapper } from './users.mapper';
import { UsersQueryDto } from './dto/users-query.dto';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';

@ApiUsersController()
@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCreateUserDoc()
  @Post()
  async createUser(
    @Body() dto: CreateUserDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<UserResponseDto> {
    const user = await this.usersService.createUser(
      req.user.ownerId,
      req.user.role,
      dto,
    );

    return UsersMapper.toResponse(user);
  }

  @ApiFindAllUsersDoc()
  @Get()
  async findAll(
    @Query() query: UsersQueryDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const result = await this.usersService.findAllByOwner(
      req.user.ownerId,
      query,
    );
    const data: UserResponseDto[] = result.data.map((user) =>
      UsersMapper.toResponse(user),
    );

    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @ApiFindUserByIdDoc()
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(req.user.ownerId, id);

    return UsersMapper.toResponse(user);
  }

  @ApiUpdateUserDoc()
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateUser(req.user.ownerId, id, dto);

    return UsersMapper.toResponse(user);
  }
}
