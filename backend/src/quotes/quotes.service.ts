import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

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

  async create(dto: CreateQuoteDto) {
    const problems = (dto.problemes ?? []).map((problem) => problemMap[problem]);

    const quote = await this.prisma.quote.create({
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

    void this.sendNotificationEmail({
      prenom: dto.prenom.trim(),
      nom: dto.nom.trim(),
      courriel: dto.courriel.trim().toLowerCase(),
      telephone: dto.telephone.trim(),
      ville: dto.ville.trim(),
      typeProjet: dto.type_projet,
      problemes: dto.problemes ?? [],
      envergure: dto.envergure,
      ageFenetres: dto.age_fenetres,
      mesures: dto.mesures?.trim() || '',
      momentContact: dto.moment_contact,
      quoteId: quote.id,
    });
    void this.sendCustomerConfirmationEmail({
      prenom: dto.prenom.trim(),
      courriel: dto.courriel.trim().toLowerCase(),
      quoteId: quote.id,
    });

    return quote;
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

  private async sendNotificationEmail(payload: {
    prenom: string;
    nom: string;
    courriel: string;
    telephone: string;
    ville: string;
    typeProjet: string;
    problemes: string[];
    envergure: string;
    ageFenetres: string;
    mesures: string;
    momentContact: string;
    quoteId: string;
  }) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('NOTIFICATION_FROM');
    const to = this.config.get<string>('NOTIFICATION_TO');

    if (!apiKey || !from || !to) {
      this.logger.warn('Resend notification skipped: missing email environment variables');
      return;
    }

    const lines = [
      'Nouvelle soumission Pure Tint',
      '',
      `ID: ${payload.quoteId}`,
      `Nom: ${payload.prenom} ${payload.nom}`,
      `Courriel: ${payload.courriel}`,
      `Telephone: ${payload.telephone}`,
      `Ville: ${payload.ville}`,
      `Type de projet: ${payload.typeProjet}`,
      `Problemes: ${payload.problemes.join(', ') || 'Aucun'}`,
      `Envergure: ${payload.envergure}`,
      `Age des fenetres: ${payload.ageFenetres}`,
      `Mesures: ${payload.mesures || 'Non precisees'}`,
      `Moment de contact: ${payload.momentContact}`,
    ];

    await this.sendEmail({
      apiKey,
      from,
      to,
      subject: 'Nouvelle soumission Pure Tint',
      text: lines.join('\n'),
      logLabel: 'internal notification',
    });
  }

  private async sendCustomerConfirmationEmail(payload: {
    prenom: string;
    courriel: string;
    quoteId: string;
  }) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('NOTIFICATION_FROM');

    if (!apiKey || !from) {
      this.logger.warn('Resend customer confirmation skipped: missing email environment variables');
      return;
    }

    const lines = [
      `Bonjour ${payload.prenom},`,
      '',
      'Merci pour votre demande de soumission avec Pure Tint.',
      'Nous avons bien recu votre demande et nous vous contacterons rapidement pour discuter de votre projet.',
      '',
      `Numero de demande: ${payload.quoteId}`,
      '',
      'Pure Tint',
      'Services de pellicules pour fenetres au Quebec',
    ];

    await this.sendEmail({
      apiKey,
      from,
      to: payload.courriel,
      subject: 'Confirmation de votre demande Pure Tint',
      text: lines.join('\n'),
      logLabel: 'customer confirmation',
    });
  }

  private async sendEmail(payload: {
    apiKey: string;
    from: string;
    to: string;
    subject: string;
    text: string;
    logLabel: string;
  }) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${payload.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: payload.from,
          to: [payload.to],
          subject: payload.subject,
          text: payload.text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Resend ${payload.logLabel} failed: ${response.status} ${errorText}`,
        );
      }
    } catch (error) {
      this.logger.error(`Resend ${payload.logLabel} failed`, error);
    }
  }
}
