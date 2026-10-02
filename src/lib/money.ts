const MINOR_UNITS_PER_HRYVNIA = 100;

function shiftDecimal(value: number, places: number): number {
  const [mantissa, exponent = "0"] = value.toString().split("e");
  return Number(`${mantissa}e${Number(exponent) + places}`);
}

export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError("Money amount must be a finite number.");
  }

  const sign = Math.sign(amount);
  return sign * Math.round(shiftDecimal(Math.abs(amount), 2));
}

export function fromMinorUnits(amount: number): number {
  return amount / MINOR_UNITS_PER_HRYVNIA;
}

export function roundMoney(amount: number): number {
  return fromMinorUnits(toMinorUnits(amount));
}

export function multiplyMoney(amount: number, quantity: number): number {
  return fromMinorUnits(toMinorUnits(amount) * quantity);
}

export function sumMoney(amounts: Iterable<number>): number {
  let total = 0;
  for (const amount of amounts) {
    total += toMinorUnits(amount);
  }
  return fromMinorUnits(total);
}

export function subtractMoney(amount: number, discount: number): number {
  return fromMinorUnits(Math.max(0, toMinorUnits(amount) - toMinorUnits(discount)));
}

export function formatMoney(amount: number): string {
  const minorUnits = toMinorUnits(amount);
  const sign = minorUnits < 0 ? "-" : "";
  const absoluteMinorUnits = Math.abs(minorUnits);
  const hryvnias = Math.floor(absoluteMinorUnits / MINOR_UNITS_PER_HRYVNIA);
  const kopiykas = absoluteMinorUnits % MINOR_UNITS_PER_HRYVNIA;

  if (kopiykas === 0) return `${sign}${hryvnias}`;
  if (kopiykas % 10 === 0) return `${sign}${hryvnias}.${kopiykas / 10}`;
  return `${sign}${hryvnias}.${kopiykas.toString().padStart(2, "0")}`;
}
