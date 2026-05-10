import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuotesService } from './quotes.service';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll() {
    return this.quotesService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuoteStatusDto) {
    return this.quotesService.updateStatus(id, dto.status);
  }
}
