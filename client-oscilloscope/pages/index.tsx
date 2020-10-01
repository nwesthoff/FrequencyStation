import { useEffect, useState } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useSocket } from "../api/useSocket";
import Sound from "../components/Sound";
import { offsetFrom } from "../components/utils/OffsetFrom";
import { gainCalculation } from "../components/utils/GainCalculation";
import { config } from "../config";
import { Player, BitCrusher, PingPongDelay, Freeverb, Gain } from "tone";
import { limitValue } from "../components/utils/LimitValue";

export interface MagnetoMessage {
  rssi: number;
  bt_addr: string;
  knobs: {
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

  useEffect(() => {
    const fx1 = new BitCrusher({
      bits: 4,
    }).toDestination();
    const fx2 = new PingPongDelay("4n", 0.2).connect(fx1);
    const fx3 = new Freeverb().connect(fx2);

    const moonGain = new Gain(0).connect(fx3);
    const earthGain = new Gain(0).connect(fx3);
    const sulfurGain = new Gain(0).connect(fx3);
    const sunGain = new Gain(0).connect(fx3);

    socket?.on("connect", (res) => {
      console.log(res);

      const moonPlayer = new Player({
        url: "/audio/moon.wav",
        loop: true,
        autostart: true,
      });

      const earthPlayer = new Player({
        url: "/audio/earth.wav",
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
      earthPlayer.connect(earthGain);
      sulfurPlayer.connect(sulfurGain);
      sunPlayer.connect(sunGain);

      socket.on("message", (msg: MagnetoMessage) => {
        fx1.set({
          wet: limitValue(
            offsetFrom(msg?.knobs?.balance, config.earthFieldBalance)
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

        sunGain.set({
          gain: gainCalculation(msg.rssi, config.sunGainTarget),
        });
        moonGain.set({
          gain: 0,
        });
        earthGain.set({
          gain: 0,
        });
        sulfurGain.set({
          gain: gainCalculation(msg.rssi, config.sulfurGainTarget),
        });

        setLastMsg(msg);
      });

      return () => {
        moonPlayer.dispose();
        earthPlayer.dispose();
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
        <h2>Gain: {Math.abs(lastMsg?.rssi / 100)}</h2>
        <h3>
          Sun Gain:{" "}
          {gainCalculation(lastMsg?.rssi, config.sunGainTarget).toFixed(2)}
        </h3>
        <h3>
          Sulfur Gain:{" "}
          {gainCalculation(lastMsg?.rssi, config.sulfurGainTarget).toFixed(2)}
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
