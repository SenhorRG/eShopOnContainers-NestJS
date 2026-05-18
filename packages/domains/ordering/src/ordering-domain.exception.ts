export class OrderingDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderingDomainException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
