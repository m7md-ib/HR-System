import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = Decimal.Value;

export function money(value: MoneyInput): Decimal {
  return new Decimal(value ?? 0);
}

/** Rounds to 2 decimal places (currency precision) using round-half-up. */
export function roundMoney(value: MoneyInput): Decimal {
  return money(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function addMoney(...values: MoneyInput[]): Decimal {
  return values.reduce<Decimal>((sum, v) => sum.plus(money(v)), new Decimal(0));
}

export function subtractMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return money(a).minus(money(b));
}

/** Converts a monetary value to the fixed-2dp string Prisma's Decimal columns expect. */
export function toPrismaDecimal(value: MoneyInput): string {
  return roundMoney(value).toFixed(2);
}

export function toNumber(value: MoneyInput): number {
  return money(value).toNumber();
}

export function formatMoney(value: MoneyInput, currency = "JOD"): string {
  return `${roundMoney(value).toFixed(2)} ${currency}`;
}

export function isNegative(value: MoneyInput): boolean {
  return money(value).isNegative();
}

export { Decimal };
