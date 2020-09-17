import React, { ReactElement } from "react";
import OscilloscopeCanvas from "../components/OscilloscopeCanvas";

interface Props {}

export default function Scope({}: Props): ReactElement {
  return (
    <div>
      <OscilloscopeCanvas />
    </div>
  );
}
