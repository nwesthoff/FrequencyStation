import { limitValue } from "./LimitValue";
import { offsetFrom } from "./OffsetFrom";

export const gainCalculation = (rssi: number) => {
  return limitValue(1 - Math.abs(rssi) / 90);
};
