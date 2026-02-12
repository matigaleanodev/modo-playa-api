import { UserDocument } from './schemas/user.schema';
import { UserResponseDto } from './dto/user-response.dto';

export class UsersMapper {
  static toResponse(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      isPasswordSet: user.isPasswordSet,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
    };
  }
}
