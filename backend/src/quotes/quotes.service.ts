import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContactTime,
  Prisma,
  ProjectScope,
  ProjectType,
  QuoteProblem,
  QuoteStatus,
  WindowAge,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

const projectTypeMap: Record<CreateQuoteDto['type_projet'], ProjectType> = {
  residentiel: ProjectType.RESIDENTIAL,
  commercial: ProjectType.COMMERCIAL,
};

const problemMap: Record<NonNullable<CreateQuoteDto['problemes']>[number], QuoteProblem> = {
  intimite: QuoteProblem.INTIMITE,
  chaleur: QuoteProblem.CHALEUR,
  uv: QuoteProblem.UV,
  securite: QuoteProblem.SECURITE,
};

const projectScopeMap: Record<CreateQuoteDto['envergure'], ProjectScope> = {
  une_fenetre: ProjectScope.UNE_FENETRE,
  quelques_fenetres: ProjectScope.QUELQUES_FENETRES,
  facade_complete: ProjectScope.FACADE_COMPLETE,
  batiment_complet: ProjectScope.BATIMENT_COMPLET,
};

const windowAgeMap: Record<CreateQuoteDto['age_fenetres'], WindowAge> = {
  plus_de_10_ans: WindowAge.PLUS_DE_10_ANS,
  moins_de_10_ans: WindowAge.MOINS_DE_10_ANS,
  inconnu: WindowAge.INCONNU,
};

const contactTimeMap: Record<CreateQuoteDto['moment_contact'], ContactTime> = {
  am: ContactTime.AM,
  debut_pm: ContactTime.DEBUT_PM,
  fin_pm: ContactTime.FIN_PM,
  soiree: ContactTime.SOIREE,
};

const quoteSummarySelect = {
  id: true,
  createdAt: true,
  status: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  city: true,
  projectType: true,
  problems: true,
  projectScope: true,
  windowAge: true,
  measurements: true,
  bestContactTime: true,
  notes: true,
} satisfies Prisma.QuoteSelect;

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.quote.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: quoteSummarySelect,
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      select: quoteSummarySelect,
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  create(dto: CreateQuoteDto) {
    const problems = (dto.problemes ?? []).map((problem) => problemMap[problem]);

    return this.prisma.quote.create({
      data: {
        firstName: dto.prenom.trim(),
        lastName: dto.nom.trim(),
        email: dto.courriel.trim().toLowerCase(),
        phone: dto.telephone.trim(),
        city: dto.ville.trim(),
        projectType: projectTypeMap[dto.type_projet],
        problems,
        projectScope: projectScopeMap[dto.envergure],
        windowAge: windowAgeMap[dto.age_fenetres],
        measurements: dto.mesures?.trim() || null,
        bestContactTime: contactTimeMap[dto.moment_contact],
      } satisfies Prisma.QuoteCreateInput,
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });
  }

  async updateStatus(id: string, status: keyof typeof QuoteStatus) {
    try {
      return await this.prisma.quote.update({
        where: { id },
        data: {
          status: QuoteStatus[status],
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Quote not found');
      }

      throw error;
    }
  }
}
