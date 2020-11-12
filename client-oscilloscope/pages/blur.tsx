import { useEffect, useState } from "react";
import Head from "next/head";
import styles from "../styles/Blur.module.css";
import { useSocket } from "../api/useSocket";
import { offsetFrom } from "../components/utils/OffsetFrom";
import { gainCalculation } from "../components/utils/GainCalculation";
import { config } from "../config";
import { Player, BitCrusher, Freeverb, Gain, PitchShift } from "tone";
import { limitValue } from "../components/utils/LimitValue";
import KalmanFilter from "kalmanjs";
import BlurChildren from "../components/BlurChildren";
import { BsTriangleFill, BsCircleFill, BsSquareFill } from "react-icons/bs";

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
  const [soundRegistered, setSoundRegistered] = useState(false);

  const [lastMutpuc, setLastMutpuc] = useState<MagnetoMessage>(null);
  const [lastMuex2q, setLastMuex2q] = useState<MagnetoMessage>(null);
  const [lastMukio3, setLastMukio3] = useState<MagnetoMessage>(null);
  const filteredRssi = {
    MutPUc: new KalmanFilter(),
    MuEx2Q: new KalmanFilter(),
    MukIO3: new KalmanFilter(),
  };

  useEffect(() => {
    socket?.on("connect", (res) => {
      console.log(res);
    });
  }, [socket]);

  const registerSound = () => {
    setSoundRegistered(true);

    const fx1 = new BitCrusher({
      bits: 4,
    }).toDestination();
    const fx2 = new PitchShift(12).connect(fx1);
    const fx3 = new Freeverb().connect(fx2);

    const muex2qGain = new Gain(0).connect(fx3);
    const mutpucGain = new Gain(0).connect(fx3);
    const mukio3Gain = new Gain(0).connect(fx3);

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
        setLastMutpuc({ ...msg, rssi: filteredRSSI });

        mutpucGain.set({
          gain: gainCalculation(filteredRSSI),
        });
      } else if (msg.bt_addr === "cf:99:79:62:06:42") {
        // BEACONID: MukIO3
        const filteredRSSI = filteredRssi.MukIO3.filter(msg.rssi);
        setLastMukio3({ ...msg, rssi: filteredRSSI });

        mukio3Gain.set({
          gain: gainCalculation(filteredRSSI),
        });
      } else if (msg.bt_addr === "fb:f3:2f:d2:92:80") {
        // BEACONID: MuEx2Q
        const filteredRSSI = filteredRssi.MuEx2Q.filter(msg.rssi);

        setLastMuex2q({ ...msg, rssi: filteredRSSI });

        muex2qGain.set({
          gain: gainCalculation(filteredRSSI),
        });
      } else {
        // setLastMsg(msg);
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
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Magnetoscope - Blur Experiment</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {!soundRegistered ? (
        <button onClick={registerSound}>go to app</button>
      ) : (
        <main className={styles.main}>
          {/* DEBUG DATA */}
          <div
            style={{
              position: "fixed",
              top: 0,
              opacity: 0.3,
              width: "90%",
              maxWidth: "768px",
              justifyContent: "space-between",
              display: "flex",
              padding: "1.2rem 2rem",
            }}
          >
            <div>
              universe: {gainCalculation(lastMukio3?.rssi).toFixed(2) || 0}
            </div>
            <div>
              world: {gainCalculation(lastMutpuc?.rssi).toFixed(2) || 0}
            </div>
            <div>city: {gainCalculation(lastMuex2q?.rssi).toFixed(2) || 0}</div>
          </div>
          {/* SYMBOL BLUR COMPONENTS */}
          <div
            style={{
              width: "90%",
              maxWidth: "1200px",
              justifyContent: "space-between",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <BlurChildren normalizedBlurVal={gainCalculation(lastMukio3?.rssi)}>
              <h2 style={{ fontSize: "3.2em" }}>Universe</h2>
              <BsCircleFill size="large" />
            </BlurChildren>
            <BlurChildren normalizedBlurVal={gainCalculation(lastMutpuc?.rssi)}>
              <h2 style={{ fontSize: "3.2em" }}>World</h2>
              <BsSquareFill size="large" />
            </BlurChildren>
            <BlurChildren normalizedBlurVal={gainCalculation(lastMuex2q?.rssi)}>
              <h2 style={{ fontSize: "3.2em" }}>City</h2>
              <BsTriangleFill size="large" />
            </BlurChildren>
          </div>
        </main>
      )}
    </div>
  );
}
