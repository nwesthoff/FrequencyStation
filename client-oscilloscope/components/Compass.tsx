import React, { ReactElement } from "react";
import styles from "./Compass.module.css";

interface Props {
  direction: number;
}

export default function Compass({ direction }: Props): ReactElement {
  return (
    <div>
      <div
        className={styles.dial}
        style={{ transform: `rotate(${direction}deg)` }}
      ></div>
      <div className={styles.hands}>
        <div className={styles.hand}></div>
      </div>
      <div className={styles.handsSmall}>
        <div className={styles.handSmall}></div>
      </div>
    </div>
  );
}
