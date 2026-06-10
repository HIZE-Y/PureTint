import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackVisitDto } from './dto/track-visit.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackVisit(dto: TrackVisitDto, userAgent?: string) {
    await this.prisma.siteVisit.create({
      data: {
        sessionId: dto.sessionId,
        path: dto.path,
        language: dto.language || null,
        referrer: dto.referrer || null,
        userAgent: userAgent || null,
      },
    });

    return { ok: true };
  }

  async getSummary() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [totalVisits, uniqueVisitors, recentVisits, topPages] = await Promise.all([
      this.prisma.siteVisit.count(),
      this.prisma.siteVisit.findMany({
        distinct: ['sessionId'],
        select: { sessionId: true },
      }),
      this.prisma.siteVisit.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: {
          id: true,
          createdAt: true,
          sessionId: true,
          path: true,
          language: true,
          referrer: true,
        },
      }),
      this.prisma.siteVisit.groupBy({
        by: ['path'],
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalVisits,
      uniqueVisitors: uniqueVisitors.length,
      recentVisits,
      topPages: topPages.map((page) => ({
        path: page.path,
        visits: page._count.path,
      })),
    };
  }
}
