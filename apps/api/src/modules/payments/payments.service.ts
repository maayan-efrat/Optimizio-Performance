import { Injectable, BadRequestException, Logger, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Credit packages: priceId → { credits, amountIls, productName }
export const CREDIT_PACKAGES: Record<string, { credits: number; amountIls: number; productName: string }> = {
  pack_200:  { credits: 200,  amountIls: 10, productName: '200 קרדיטים — Optimizio' },
  pack_500:  { credits: 500,  amountIls: 22, productName: '500 קרדיטים — Optimizio' },
  pack_1200: { credits: 1200, amountIls: 45, productName: '1200 קרדיטים — Optimizio' },
};

const CARDCOM_API = 'https://secure.cardcom.solutions/api/v11/LowProfile/Create';

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  get paymentsEnabled(): boolean {
    return process.env.PAYMENTS_ENABLED === 'true';
  }

  // ── Create Cardcom Low-Profile payment URL ────────────────────────────────
  async createCheckoutSession(userId: string, packageId: string): Promise<{ url: string }> {
    if (!this.paymentsEnabled) {
      throw new ServiceUnavailableException('התשלומים אינם זמינים כרגע. נסי שוב מאוחר יותר.');
    }

    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) throw new BadRequestException('Invalid package');

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const apiUrl      = process.env.API_URL      ?? 'http://localhost:4000';

    const payload = {
      TerminalNumber:      process.env.CARDCOM_TERMINAL ?? '',
      ApiName:             process.env.CARDCOM_API_NAME  ?? '',
      ReturnValue:         `${userId}|${packageId}`,   // passed back in webhook
      Amount:              pkg.amountIls,
      CurrencyType:        1,                           // 1 = ILS
      Language:            'he',
      MaxPayments:         1,
      ProductName:         pkg.productName,
      SuccessRedirectUrl:  `${frontendUrl}/payment/success?pkg=${packageId}`,
      FailedRedirectUrl:   `${frontendUrl}/payment/cancel`,
      WebHookUrl:          `${apiUrl}/api/payments/webhook`,
      Codepage:            65001,
    };

    const res = await fetch(CARDCOM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json: any = await res.json();
    this.log.log(`Cardcom response: ${JSON.stringify(json)}`);

    if (json.ResponseCode !== 0 || !json.LowProfileCode) {
      throw new BadRequestException(`Cardcom error: ${json.Description ?? 'Unknown error'}`);
    }

    const payUrl = `https://secure.cardcom.solutions/External/LowProfile.aspx?LowProfileCode=${json.LowProfileCode}`;
    return { url: payUrl };
  }

  // ── Handle Cardcom Webhook (POST callback after payment) ──────────────────
  async handleWebhook(body: Record<string, any>): Promise<void> {
    const responseCode = parseInt(body.ResponseCode ?? body.responseCode ?? '-1', 10);

    if (responseCode !== 0) {
      this.log.warn(`Cardcom payment failed. Code: ${responseCode}`);
      return;
    }

    const returnValue: string = body.ReturnValue ?? body.returnValue ?? '';
    const [userId, packageId] = returnValue.split('|');

    if (!userId || !packageId) {
      this.log.error(`Invalid ReturnValue: "${returnValue}"`);
      return;
    }

    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      this.log.error(`Unknown package: ${packageId}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: pkg.credits } },
    });

    this.log.log(`Added ${pkg.credits} credits to user ${userId} (package ${packageId})`);
  }

  // ── Get user credits ──────────────────────────────────────────────────────
  async getCredits(userId: string): Promise<{ credits: number; paymentsEnabled: boolean }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { credits: user.credits, paymentsEnabled: this.paymentsEnabled };
  }

  // ── Deduct credits for a feature action ───────────────────────────────────
  async deductCredits(userId: string, amount: number): Promise<{ credits: number }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.credits < amount) {
      throw new ForbiddenException(`אין מספיק קרדיטים. נדרשים ${amount}, יש ${user.credits}.`);
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
    return { credits: updated.credits };
  }
}
