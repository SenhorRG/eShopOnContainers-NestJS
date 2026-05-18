export class IdentityDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityDomainException';
  }
}
