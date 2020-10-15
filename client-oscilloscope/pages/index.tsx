import React, { ReactElement } from "react";
import Link from "next/link";

interface Props {}

export default function Index({}: Props): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
      }}
    >
      <Link href="app">
        <a>go to app</a>
      </Link>
    </div>
  );
}
