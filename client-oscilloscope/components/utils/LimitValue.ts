export const limitValue = (value: number) => {
  if (value <= 0.1) {
    value = 0;
  } else if (value >= 1) {
    value = 1;
  }
  return value;
};
