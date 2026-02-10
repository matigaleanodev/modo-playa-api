import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            findAllByOwner: jest.fn(),
            findById: jest.fn(),
            updateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('debería crear un usuario', async () => {
    const dto: CreateUserDto = {
      email: 'test@mail.com',
      username: 'test',
    };

    service.createUser.mockResolvedValue({});

    await controller.createUser(dto);

    expect(service.createUser).toHaveBeenCalled();
  });

  it('debería listar usuarios', async () => {
    service.findAllByOwner.mockResolvedValue([]);

    const result = await controller.findAll();

    expect(result).toEqual([]);
    expect(service.findAllByOwner).toHaveBeenCalled();
  });

  it('debería obtener un usuario por id', async () => {
    service.findById.mockResolvedValue({});

    const result = await controller.findById('user-id');

    expect(result).toBeDefined();
    expect(service.findById).toHaveBeenCalled();
  });

  it('debería actualizar un usuario', async () => {
    const dto: UpdateUserDto = {
      firstName: 'Juan',
    };

    service.updateUser.mockResolvedValue({ firstName: 'Juan' });

    const result = await controller.updateUser('user-id', dto);

    expect(result?.firstName).toBe('Juan');
    expect(service.updateUser).toHaveBeenCalled();
  });
});
