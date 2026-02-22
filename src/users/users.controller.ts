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
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CREATE_USER_EXAMPLE,
  USER_RESPONSE_EXAMPLE,
  USER_LIST_RESPONSE_EXAMPLE,
  UPDATE_USER_EXAMPLE,
} from './users.swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersMapper } from './users.mapper';
import { UsersQueryDto } from './dto/users-query.dto';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';

@ApiTags('Admin - Users')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Crear usuario para el owner actual',
    description:
      'Crea un usuario asociado al owner autenticado. Límite de 3 usuarios por owner salvo SUPERADMIN.',
  })
  @ApiBody({
    schema: {
      example: CREATE_USER_EXAMPLE,
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado correctamente',
    schema: { example: USER_RESPONSE_EXAMPLE },
  })
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

  @ApiOperation({
    summary: 'Listar usuarios del owner actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de usuarios',
    schema: { example: USER_LIST_RESPONSE_EXAMPLE },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de registros por página',
  })
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

  @ApiOperation({
    summary: 'Obtener usuario por ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    schema: { example: USER_RESPONSE_EXAMPLE },
  })
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(req.user.ownerId, id);

    return UsersMapper.toResponse(user);
  }

  @ApiOperation({
    summary: 'Actualizar usuario',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
  })
  @ApiBody({
    schema: {
      example: UPDATE_USER_EXAMPLE,
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado',
    schema: { example: USER_RESPONSE_EXAMPLE },
  })
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
