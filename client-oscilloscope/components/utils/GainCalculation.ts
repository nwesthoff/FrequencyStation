import { limitValue } from "./LimitValue";
import { offsetFrom } from "./OffsetFrom";

export const gainCalculation = (rssi: number, target: number) => {
  return limitValue(1 - offsetFrom(Math.abs(rssi) / 100, target) * 5);
};
