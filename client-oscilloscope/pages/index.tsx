import { useEffect, useState } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useSocket } from "../api/useSocket";
import { offsetFrom } from "../components/utils/OffsetFrom";
import { gainCalculation } from "../components/utils/GainCalculation";
import { config } from "../config";
import { Player, BitCrusher, Freeverb, Gain, PitchShift } from "tone";
import { limitValue } from "../components/utils/LimitValue";
import KalmanFilter from "kalmanjs";
import Compass from "../components/Compass";

export interface MagnetoMessage {
  rssi?: number;
  bt_addr?: string;
  knobs: {
    heading?: number;
    balance: number;
    frequency: number;
    variance: number;
  };
}

export default function Home() {
  const socket = useSocket(
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"
  );
  const [lastMsg, setLastMsg] = useState<MagnetoMessage>(null);
  const filteredRssi = {
    MutPUc: new KalmanFilter(),
    MuEx2Q: new KalmanFilter(),
    MukIO3: new KalmanFilter(),
  };

  useEffect(() => {
    const fx1 = new BitCrusher({
      bits: 4,
    }).toDestination();
    const fx2 = new PitchShift(12).connect(fx1);
    const fx3 = new Freeverb().connect(fx2);

    const moonGain = new Gain(0).connect(fx3);
    const sulfurGain = new Gain(1).connect(fx3);
    const sunGain = new Gain(0).connect(fx3);

    socket?.on("connect", (res) => {
      const moonPlayer = new Player({
        url: "/audio/moon.wav",
        loop: true,
        autostart: true,
      });
      const sulfurPlayer = new Player({
        url: "/audio/ursa-minor.wav",
        loop: true,
        autostart: true,
      });
      const sunPlayer = new Player({
        url: "/audio/virgo.wav",
        loop: true,
        autostart: true,
      });

      moonPlayer.connect(moonGain);
      sulfurPlayer.connect(sulfurGain);
      sunPlayer.connect(sunGain);

      socket.on("message", (msg: MagnetoMessage) => {
        if (msg.bt_addr === "f4:fd:48:5f:3c:0c") {
          // BEACONID: MutPUc
          const filteredRSSI = filteredRssi.MutPUc.filter(msg.rssi);
          sulfurGain.set({
            gain: gainCalculation(filteredRSSI),
          });
        } else if (msg.bt_addr === "cf:99:79:62:06:42") {
          // BEACONID: MukIO3
          const filteredRSSI = filteredRssi.MukIO3.filter(msg.rssi);

          sunGain.set({
            gain: gainCalculation(filteredRSSI),
          });
        } else if (msg.bt_addr === "fb:f3:2f:d2:92:80") {
          // BEACONID: MuEx2Q
          const filteredRSSI = filteredRssi.MuEx2Q.filter(msg.rssi);

          setLastMsg({ ...msg, rssi: filteredRSSI });

          moonGain.set({
            gain: gainCalculation(filteredRSSI),
          });
        } else {
          setLastMsg(msg);
          // console.log(msg.bt_addr);
        }

        fx1.set({
          wet: limitValue(
            offsetFrom(msg?.knobs?.heading, config.targetHeading) / 50
          ),
        });

        fx2.set({
          wet: limitValue(
            offsetFrom(msg?.knobs?.frequency, config.magneticFrequency)
          ),
        });

        fx3.set({
          wet: limitValue(
            offsetFrom(msg?.knobs?.variance, config.magneticVariance)
          ),
        });
      });

      return () => {
        moonPlayer.dispose();
        sulfurPlayer.dispose();
        sunPlayer.dispose();
        fx1.dispose();
        fx2.dispose();
        fx3.dispose();
      };
    });
  }, [socket]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Listen to this</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>
          Check out the{" "}
          <a href="https://github.com/kritzikratzi/Oscilloscope/">
            oscilloscope
          </a>{" "}
          app
        </h1>
        <hr />
        <h3>
          MuEx2Q RSSI: {lastMsg?.rssi?.toFixed(2)} | Gain:{" "}
          {gainCalculation(lastMsg?.rssi)?.toFixed(2)}
        </h3>
        <hr />
        <Compass direction={lastMsg?.knobs?.heading} />
        <h3>
          Heading: {lastMsg?.knobs?.heading} | offset:{" "}
          {limitValue(
            offsetFrom(lastMsg?.knobs?.heading, config.targetHeading) / 50
          )}
        </h3>
        <hr />
        <h3>
          variance:{lastMsg?.knobs?.variance} | offset:{" "}
          {offsetFrom(
            lastMsg?.knobs?.variance,
            config.magneticVariance
          ).toFixed(2)}
        </h3>
        <h3>
          frequency: {lastMsg?.knobs?.frequency} | offset:{" "}
          {offsetFrom(
            lastMsg?.knobs?.frequency,
            config.magneticFrequency
          ).toFixed(2)}
        </h3>
        <h3>
          balance: {lastMsg?.knobs?.balance} | offset:{" "}
          {offsetFrom(
            lastMsg?.knobs?.balance,
            config.earthFieldBalance
          ).toFixed(2)}
        </h3>
      </main>
    </div>
  );
}
