import { ReactElement, useEffect } from "react";
import { config } from "../config";
import { MagnetoMessage } from "../pages";

interface Props {
  msg: MagnetoMessage;
}

export default function Sound({ msg }: Props): ReactElement {
  useEffect(() => {}, [msg]);
  return null;
}
