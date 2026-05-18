import { IdentityDomainException } from './identity-domain.exception';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!normalized) {
      throw new IdentityDomainException('Email is required.');
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new IdentityDomainException('Email format is invalid.');
    }
    return new Email(normalized);
  }
}
