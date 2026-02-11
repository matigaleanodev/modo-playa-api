import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private emailFrom: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.emailFrom = this.configService.get<string>('RESEND_FROM_EMAIL')!;
    this.resend = new Resend(apiKey);
  }

  async sendResetCode(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: 'Modo Playa <${}>',
      to: email,
      subject: 'Código de recuperación de contraseña',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Recuperación de contraseña</h2>
          <p>Tu código de verificación es:</p>
          <h1>${code}</h1>
          <p>Este código vence en 15 minutos.</p>
          <p>Si no solicitaste este cambio, podés ignorar este mensaje.</p>
        </div>
      `,
    });
  }

  async sendPasswordChanged(email: string): Promise<void> {
    await this.resend.emails.send({
      from: `Modo Playa <${this.emailFrom}>`,
      to: email,
      subject: 'Tu contraseña fue modificada',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Contraseña actualizada</h2>
          <p>Tu contraseña fue cambiada correctamente.</p>
          <p>Si no fuiste vos, contactate inmediatamente.</p>
        </div>
      `,
    });
  }
}
