import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AnalyticsService } from './analytics.service';
import { TrackVisitDto } from './dto/track-visit.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('visit')
  trackVisit(@Body() dto: TrackVisitDto, @Headers('user-agent') userAgent?: string) {
    return this.analyticsService.trackVisit(dto, userAgent);
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('summary')
  getSummary() {
    return this.analyticsService.getSummary();
  }
}
