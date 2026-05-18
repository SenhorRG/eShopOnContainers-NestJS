export function maskCardNumber(cardNumber: string): string {
  const last4 = cardNumber.slice(-4);
  return cardNumber.slice(0, Math.max(cardNumber.length - last4.length, 0)).replace(/\d/g, 'X') + last4;
}
