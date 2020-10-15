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
  const [useCompass, setUseCompass] = useState(false);

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

    const muex2qGain = new Gain(0).connect(fx3);
    const mutpucGain = new Gain(0).connect(fx3);
    const mukio3Gain = new Gain(0).connect(fx3);

    socket?.on("connect", (res) => {
      const muex2qPlayer = new Player({
        url: "/audio/amsterdam-triangle.wav",
        loop: true,
        autostart: true,
      });
      const mutpucPlayer = new Player({
        url: "/audio/earth-square.wav",
        loop: true,
        autostart: true,
      });
      const mukio3Player = new Player({
        url: "/audio/universe-circle.wav",
        loop: true,
        autostart: true,
      });

      muex2qPlayer.connect(muex2qGain);
      mutpucPlayer.connect(mutpucGain);
      mukio3Player.connect(mukio3Gain);

      socket.on("message", (msg: MagnetoMessage) => {
        if (msg.bt_addr === "f4:fd:48:5f:3c:0c") {
          // BEACONID: MutPUc
          const filteredRSSI = filteredRssi.MutPUc.filter(msg.rssi);
          mutpucGain.set({
            gain: gainCalculation(filteredRSSI),
          });
        } else if (msg.bt_addr === "cf:99:79:62:06:42") {
          // BEACONID: MukIO3
          const filteredRSSI = filteredRssi.MukIO3.filter(msg.rssi);

          mukio3Gain.set({
            gain: gainCalculation(filteredRSSI),
          });
        } else if (msg.bt_addr === "fb:f3:2f:d2:92:80") {
          // BEACONID: MuEx2Q
          const filteredRSSI = filteredRssi.MuEx2Q.filter(msg.rssi);

          setLastMsg({ ...msg, rssi: filteredRSSI });

          muex2qGain.set({
            gain: gainCalculation(filteredRSSI),
          });
        } else {
          setLastMsg(msg);
          // console.log(msg.bt_addr);
        }

        fx1.set({
          wet: limitValue(
            useCompass
              ? offsetFrom(msg?.knobs?.heading, config.targetHeading) / 50
              : offsetFrom(msg?.knobs?.balance, config.earthFieldBalance)
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
        muex2qPlayer.dispose();
        mutpucPlayer.dispose();
        mukio3Player.dispose();
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
        <div style={{ opacity: useCompass ? 1 : 0.5 }}>
          <Compass direction={lastMsg?.knobs?.heading} />
        </div>
        <button onClick={() => setUseCompass(!useCompass)}>
          toggle compass {useCompass ? "off" : "on"}
        </button>
        <small style={{ opacity: 0.6 }}>
          the compass doesn't work correctly, but it is fun when it does so if
          the compass is moving like it should, try this toggle
        </small>
        <h3 style={{ opacity: useCompass ? 1 : 0.5 }}>
          Heading: {lastMsg?.knobs?.heading} | offset:{" "}
          {limitValue(
            offsetFrom(lastMsg?.knobs?.heading, config.targetHeading, 5) / 50
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
        <h3 style={{ opacity: useCompass ? 0.5 : 1 }}>
          balance: {lastMsg?.knobs?.balance} | offset:{" "}
          {offsetFrom(
            lastMsg?.knobs?.balance,
            config.earthFieldBalance
          ).toFixed(2)}
        </h3>
        <h3>
          frequency: {lastMsg?.knobs?.frequency} | offset:{" "}
          {offsetFrom(
            lastMsg?.knobs?.frequency,
            config.magneticFrequency
          ).toFixed(2)}
        </h3>
      </main>
    </div>
  );
}
