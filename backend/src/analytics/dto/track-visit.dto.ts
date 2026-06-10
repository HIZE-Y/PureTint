import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class TrackVisitDto {
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  sessionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;
}
