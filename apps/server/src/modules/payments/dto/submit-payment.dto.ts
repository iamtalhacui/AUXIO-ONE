import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitPaymentDto {
  /** Calendar date the offline payment was made (YYYY-MM-DD). */
  @IsDateString()
  paymentDate: string;

  /** Bank reference, transfer ID, or similar. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reference: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
