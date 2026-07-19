import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createTransactionSchema, updatePaymentStatusSchema } from '@rdn/shared';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'DEALER')
  @ApiOperation({ summary: 'Create a transaction from a closed lead' })
  @UsePipes(new ZodValidationPipe(createTransactionSchema))
  async create(@Body() body: CreateTransactionDto): Promise<any> {
    return this.transactionsService.create(body);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'List transactions with filters' })
  async findAll(@Query() query: QueryTransactionsDto): Promise<any> {
    return this.transactionsService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/payment-status')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update transaction payment status' })
  @UsePipes(new ZodValidationPipe(updatePaymentStatusSchema))
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePaymentStatusDto,
  ): Promise<any> {
    return this.transactionsService.updatePaymentStatus(id, body);
  }
}
