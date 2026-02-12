import { ContactResponseDto } from '@contacts/dto/contact-response.dto';
import { ContactDocument } from '@contacts/schemas/contact.schema';

export class ContactMapper {
  static toResponse(contact: ContactDocument): ContactResponseDto {
    return {
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      whatsapp: contact.whatsapp,
      isDefault: contact.isDefault,
      active: contact.active,
      notes: contact.notes,
    };
  }
}
