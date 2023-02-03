export const minAngleDiff = (degA: number, degB: number) => {
  const diff = Math.abs((degA % 360) - (degB % 360));
  return Math.abs(Math.min(diff, 360 - diff));
};
