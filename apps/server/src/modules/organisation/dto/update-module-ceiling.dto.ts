import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateModuleCeilingDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  moduleCeilingCodes: string[];
}
