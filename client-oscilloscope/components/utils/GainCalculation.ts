import { limitValue } from "./LimitValue";
import { offsetFrom } from "./OffsetFrom";

export const gainCalculation = (rssi: number) => {
  return limitValue(1 - offsetFrom(Math.abs(rssi), 30) / 50);
};

export const blurGainCalculation = (rssi: number) => {
  const target = 65;
  rssi = Math.abs(rssi);
  rssi = rssi < target ? target : rssi;
  console.log(rssi);
  return limitValue(1 - (rssi - target) / 10);
};
