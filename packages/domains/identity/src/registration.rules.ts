import { Email } from './email.vo';
import { IdentityDomainException } from './identity-domain.exception';

export type RegistrationInput = {
  email: string;
  password: string;
  displayName: string;
};

const MIN_PASSWORD_LENGTH = 8;

export function assertValidRegistration(input: RegistrationInput): { email: Email; displayName: string } {
  const email = Email.create(input.email);
  const displayName = input.displayName.trim();
  if (!displayName) {
    throw new IdentityDomainException('Display name is required.');
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new IdentityDomainException(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return { email, displayName };
}
