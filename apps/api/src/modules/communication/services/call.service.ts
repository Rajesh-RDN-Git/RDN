import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CallService {
  private readonly logger = new Logger(CallService.name);
  private readonly isProd: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.isProd = configService.get<string>('app.environment') === 'production';
  }

  async initiateCall(callerUserId: string, leadId: string): Promise<any> {
    // Fetch lead with buyer and dealer phones (from DB, never exposed to client)
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        buyer: { select: { phone: true } },
        dealer: { include: { user: { select: { phone: true, id: true } } } },
      },
    });

    if (!lead) throw new BadRequestException('Lead not found');
    if (!lead.dealer) throw new BadRequestException('This lead has no assigned dealer yet');

    // Either party on the lead may start the masked call: the assigned dealer or the
    // buyer. The caller's number is the "From", the counterparty is the "To" — Exotel
    // bridges them behind the ExoPhone so neither sees the other's number.
    const isDealer = lead.dealer.userId === callerUserId;
    const isBuyer = lead.buyerId === callerUserId;
    if (!isDealer && !isBuyer) {
      throw new BadRequestException('Only the buyer or the assigned dealer can initiate calls');
    }

    const dealerPhone = lead.dealer.user.phone;
    // Registered buyer's phone, or the free-form contact phone on a manual lead.
    const buyerPhone = lead.buyer?.phone ?? lead.contactPhone;
    if (!buyerPhone) throw new BadRequestException('This lead has no contact phone to call');
    if (!dealerPhone) throw new BadRequestException('The assigned dealer has no phone on file');

    const fromPhone = isDealer ? dealerPhone : buyerPhone;
    const toPhone = isDealer ? buyerPhone : dealerPhone;

    const apiKey = this.configService.get<string>('exotel.apiKey');
    const apiToken = this.configService.get<string>('exotel.apiToken');
    const sid = this.configService.get<string>('exotel.sid');
    const callerId = this.configService.get<string>('exotel.callerId');
    const subdomain = this.configService.get<string>('exotel.subdomain');

    if (!apiKey || !apiToken || !sid || !callerId) {
      // In production a "mock" success would lie to the dealer that a call was placed.
      if (this.isProd) {
        this.logger.error('Exotel not configured in production — cannot initiate masked call.');
        throw new ServiceUnavailableException('Calling is temporarily unavailable');
      }
      this.logger.warn('Exotel not configured. Call not initiated.');
      return {
        status: 'mock',
        message: 'Call service not configured. In production, a masked call would be initiated.',
        leadId,
      };
    }

    try {
      const url = `https://${subdomain}/v1/Accounts/${sid}/Calls/connect.json`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${apiKey}:${apiToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: fromPhone,
          To: toPhone,
          CallerId: callerId || '',
        }),
      });

      const data = await response.json();
      this.logger.log(`Exotel call initiated: ${JSON.stringify(data)}`);

      return {
        status: 'initiated',
        callSid: data?.Call?.Sid,
        leadId,
      };
    } catch (err) {
      this.logger.error(`Exotel call error: ${err}`);
      throw new BadRequestException('Failed to initiate call');
    }
  }
}
