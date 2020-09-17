export const offsetFrom = (
  value: number,
  offsetValue: number,
  snapValue = 0.05
) => {
  let offset = Math.abs(offsetValue - value);
  if (offset <= snapValue) {
    offset = 0;
  }
  return offset;
};
