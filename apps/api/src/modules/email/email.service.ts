import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      this.logger.warn('EMAIL_USER/EMAIL_PASS not set — emails will be logged only');
    }
  }

  async sendVerificationEmail(to: string, name: string, token: string) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 40px 20px; }
  .card { background: #1e293b; border-radius: 16px; padding: 40px; max-width: 500px; margin: 0 auto; border: 1px solid #334155; }
  .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg,#ec4899,#8b5cf6,#3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 24px; }
  h2 { color: #f1f5f9; font-size: 22px; margin: 0 0 12px; text-align: center; }
  p { color: #94a3b8; line-height: 1.7; }
  .btn { display: block; background: linear-gradient(135deg,#8b5cf6,#3b82f6); color: #fff; text-decoration: none; text-align: center; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 28px auto; max-width: 260px; }
  .note { font-size: 13px; color: #64748b; text-align: center; margin-top: 20px; }
</style></head>
<body>
  <div class="card">
    <div class="logo">Optimizio ⚡</div>
    <h2>ברוכה הבאה, ${name}! 🎉</h2>
    <p>תודה שנרשמת ל-Optimizio Performance. כדי להפעיל את החשבון שלך, לחצי על הכפתור למטה:</p>
    <a href="${verifyUrl}" class="btn">✅ אמתי את כתובת המייל</a>
    <p class="note">הקישור תקף ל-24 שעות.<br/>קיבלת מייל זה כי נרשמת עם כתובת זו.</p>
  </div>
</body>
</html>`;

    const text = `ברוכה הבאה ${name}!\n\nכדי לאמת את כתובת המייל שלך, בקרי ב:\n${verifyUrl}\n\nהקישור תקף ל-24 שעות.`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: `"Optimizio Performance" <${process.env.EMAIL_USER}>`,
        to,
        subject: '✅ אמתי את כתובת המייל שלך — Optimizio',
        html,
        text,
      });
      this.logger.log(`Verification email sent to ${to}`);
    } else {
      this.logger.log(`[DEV] Verify URL for ${to}: ${verifyUrl}`);
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    if (!this.transporter) {
      this.logger.log(`[DEV] Welcome email for ${name} <${to}>`);
      return;
    }
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 40px 20px; }
  .card { background: #1e293b; border-radius: 16px; padding: 40px; max-width: 500px; margin: 0 auto; border: 1px solid #334155; }
  .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg,#ec4899,#8b5cf6,#3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 24px; }
  h2 { color: #f1f5f9; font-size: 22px; margin: 0 0 12px; text-align: center; }
  p { color: #94a3b8; line-height: 1.7; }
  .credits { background: linear-gradient(135deg,#0f172a,#1e293b); border: 1px solid #8b5cf6; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
  .credits-num { font-size: 40px; font-weight: 800; color: #a78bfa; }
  .credits-label { color: #94a3b8; font-size: 14px; }
</style></head>
<body>
  <div class="card">
    <div class="logo">Optimizio ⚡</div>
    <h2>החשבון אומת בהצלחה! 🚀</h2>
    <p>כעת יש לך גישה מלאה לכלי ניתוח הביצועים שלנו.</p>
    <div class="credits">
      <div class="credits-num">150</div>
      <div class="credits-label">קרדיטים מתנה לשימוש הראשון</div>
    </div>
    <p>כל סריקה עולה 10 קרדיטים. תוכלי לרכוש עוד קרדיטים בכל עת מדף המחירים.</p>
  </div>
</body>
</html>`;

    await this.transporter.sendMail({
      from: `"Optimizio Performance" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🚀 החשבון שלך מוכן — Optimizio Performance',
      html,
    });
  }
}
