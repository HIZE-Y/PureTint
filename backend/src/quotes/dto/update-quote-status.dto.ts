import { IsIn } from 'class-validator';

const QUOTE_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'] as const;

export class UpdateQuoteStatusDto {
  @IsIn(QUOTE_STATUSES)
  status!: (typeof QUOTE_STATUSES)[number];
}
