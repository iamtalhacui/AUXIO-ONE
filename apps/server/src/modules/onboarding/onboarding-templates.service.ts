import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  getOnboardingTemplateForRole,
  isWorkforceOnboardingRole,
  type OnboardingPayload,
  type RoleOnboardingTemplate,
} from './onboarding-templates';
import {
  validateOnboardingPayload,
  type OnboardingValidationResult,
  type ValidateOnboardingOptions,
} from './onboarding-validation';

@Injectable()
export class OnboardingTemplatesService {
  getTemplateForRole(role: string): RoleOnboardingTemplate {
    const template = getOnboardingTemplateForRole(role);
    if (!template) {
      throw new ForbiddenException('Onboarding is not required for this role');
    }
    return template;
  }

  requiresOnboarding(role: string): boolean {
    return isWorkforceOnboardingRole(role);
  }

  validatePayload(
    role: string,
    payload: OnboardingPayload,
    options?: ValidateOnboardingOptions,
  ): OnboardingValidationResult {
    const template = this.getTemplateForRole(role);
    return validateOnboardingPayload(template, payload, options);
  }

  assertValidPayload(
    role: string,
    payload: OnboardingPayload,
    options?: ValidateOnboardingOptions,
  ) {
    const result = this.validatePayload(role, payload, options);
    if (!result.valid) {
      throw new BadRequestException({
        message: 'Onboarding payload is incomplete or invalid',
        issues: result.issues,
      });
    }
    return result;
  }
}
