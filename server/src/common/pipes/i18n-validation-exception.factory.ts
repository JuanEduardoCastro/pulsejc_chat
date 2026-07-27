import { BadRequestException, ValidationError } from '@nestjs/common';
import { i18nValidationErrorFactory } from 'nestjs-i18n';

function flattenConstraints(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints || {}),
    ...(error.children?.length ? flattenConstraints(error.children) : []),
  ]);
}

export function i18nValidationExceptionFactory(errors: ValidationError[]) {
  const { errors: translatedErrors } = i18nValidationErrorFactory(errors);
  return new BadRequestException(flattenConstraints(translatedErrors));
}
