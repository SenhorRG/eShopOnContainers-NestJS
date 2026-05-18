import { OrderingDomainException } from './ordering-domain.exception';

/** Buyer aggregate root data held in `ordering.buyers`. */
export class Buyer {
  id?: number;

  readonly identityGuid: string;

  name: string;

  constructor(identityGuid: string, name: string) {
    if (!identityGuid?.trim()) throw new OrderingDomainException('Identity is required');
    if (!name?.trim()) throw new OrderingDomainException('Name is required');

    this.identityGuid = identityGuid.trim();
    this.name = name.trim();
  }

  setPersisted(id: number): void {
    this.id = id;
  }
}

export function paymentMethodMatches(
  cardTypeId: number,
  cardNumber: string,
  expiration: Date,
  row: { cardTypeId: number; cardNumber: string; expiration: Date },
): boolean {
  return (
    row.cardTypeId === cardTypeId &&
    row.cardNumber === cardNumber &&
    row.expiration.getTime() === expiration.getTime()
  );
}
