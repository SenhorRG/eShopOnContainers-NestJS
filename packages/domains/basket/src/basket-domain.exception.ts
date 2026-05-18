export class BasketDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BasketDomainException';
  }
}
