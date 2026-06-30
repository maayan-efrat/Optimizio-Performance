import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // POST /payments/checkout  { packageId: "pack_200" | "pack_500" | "pack_1200" }
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @CurrentUser() user: { id: string },
    @Body() body: { packageId: string },
  ) {
    return this.payments.createCheckoutSession(user.id, body.packageId);
  }

  // GET /payments/credits
  @UseGuards(JwtAuthGuard)
  @Get('credits')
  getCredits(@CurrentUser() user: { id: string }) {
    return this.payments.getCredits(user.id);
  }

  // POST /payments/deduct  { amount: number }
  @UseGuards(JwtAuthGuard)
  @Post('deduct')
  @HttpCode(200)
  deductCredits(
    @CurrentUser() user: { id: string },
    @Body() body: { amount: number },
  ) {
    return this.payments.deductCredits(user.id, body.amount);
  }

  // POST /payments/webhook — Cardcom server-to-server callback (no auth)
  @Post('webhook')
  async handleWebhook(@Body() body: Record<string, any>) {
    await this.payments.handleWebhook(body);
    return { ok: true };
  }
}
