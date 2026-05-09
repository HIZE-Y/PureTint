import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const PROJECT_TYPES = ['residentiel', 'commercial'] as const;
const PROBLEMS = ['intimite', 'chaleur', 'uv', 'securite'] as const;
const SCOPES = [
  'une_fenetre',
  'quelques_fenetres',
  'facade_complete',
  'batiment_complet',
] as const;
const WINDOW_AGES = ['plus_de_10_ans', 'moins_de_10_ans', 'inconnu'] as const;
const CONTACT_TIMES = ['am', 'debut_pm', 'fin_pm', 'soiree'] as const;

export class CreateQuoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  prenom!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nom!: string;

  @IsEmail()
  courriel!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(50)
  telephone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  ville!: string;

  @IsIn(PROJECT_TYPES)
  type_projet!: (typeof PROJECT_TYPES)[number];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsIn(PROBLEMS, { each: true })
  problemes?: Array<(typeof PROBLEMS)[number]>;

  @IsIn(SCOPES)
  envergure!: (typeof SCOPES)[number];

  @IsIn(WINDOW_AGES)
  age_fenetres!: (typeof WINDOW_AGES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mesures?: string;

  @IsIn(CONTACT_TIMES)
  moment_contact!: (typeof CONTACT_TIMES)[number];
}
