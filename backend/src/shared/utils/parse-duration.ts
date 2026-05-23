const durationUnits = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

export const parseDurationToMilliseconds = (value: string) => {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());

  if (!match) {
    throw new Error(`Invalid duration format: ${value}`);
  }

  const amount = Number(match[1]!);
  const unit = match[2]!.toLowerCase() as keyof typeof durationUnits;

  switch (unit) {
    case "s":
      return amount * durationUnits.s;
    case "m":
      return amount * durationUnits.m;
    case "h":
      return amount * durationUnits.h;
    case "d":
      return amount * durationUnits.d;
    default:
      throw new Error(`Invalid duration unit: ${value}`);
  }
};
