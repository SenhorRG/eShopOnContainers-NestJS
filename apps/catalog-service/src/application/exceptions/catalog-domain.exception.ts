import { HttpException, HttpStatus } from '@nestjs/common';
import { CatalogDomainException as CatalogDomainError } from '@eshop/catalog-domain';

/** Maps pure domain failures to HTTP for API layers. */
export class CatalogDomainException extends HttpException {
  constructor(message = 'Catalog domain error') {
    super(message, HttpStatus.BAD_REQUEST);
  }

  static fromDomain(err: CatalogDomainError): CatalogDomainException {
    return new CatalogDomainException(err.message);
  }

  clientMessage(): string {
    return typeof this.getResponse() === 'string'
      ? (this.getResponse() as string)
      : 'Catalog operation failed';
  }
}
