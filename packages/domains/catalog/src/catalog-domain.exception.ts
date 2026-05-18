export class CatalogDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogDomainException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
