import React, { ReactElement, ReactNode } from "react";

interface Props {
  normalizedBlurVal?: number;
  children: ReactNode;
}

export default function BlurChildren({
  normalizedBlurVal,
  children,
}: Props): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: normalizedBlurVal || 0,
        filter: `blur(${(normalizedBlurVal || 0) * 16}px)`,
      }}
    >
      {children}
    </div>
  );
}
