import { ApiProperty } from '@nestjs/swagger';

export class ContactResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  whatsapp?: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ required: false })
  notes?: string;
}
