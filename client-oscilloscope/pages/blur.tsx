import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../styles/Blur.module.css";
import { useSocket } from "../api/useSocket";
import { offsetFrom } from "../components/utils/OffsetFrom";
import { blurGainCalculation } from "../components/utils/GainCalculation";
import { config } from "../config";
import { Player, BitCrusher, Freeverb, Gain, PitchShift } from "tone";
import { limitValue } from "../components/utils/LimitValue";
import KalmanFilter from "kalmanjs";
import BlurChildren from "../components/BlurChildren";
import {
  BsTriangleFill,
  BsCircleFill,
  BsSquareFill,
  BsFullscreen,
} from "react-icons/bs";

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

  const [showDebug, setShowDebug] = useState(false);
  const [soundRegistered, setSoundRegistered] = useState(false);

  const fsRef = useRef(null);
  const [lastMutpuc, setLastMutpuc] = useState<MagnetoMessage>(null);
  const [lastMuex2q, setLastMuex2q] = useState<MagnetoMessage>(null);
  const [lastMukio3, setLastMukio3] = useState<MagnetoMessage>(null);
  const [mutpucFound, setMutpucFound] = useState(false);
  const [mukio3Found, setMukio3Found] = useState(false);
  const [muex2qFound, setMuex2qFound] = useState(false);

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

        if (blurGainCalculation(msg.rssi) >= 1.0) {
          setMutpucFound(true);
        }

        mutpucGain.set({
          gain: blurGainCalculation(filteredRSSI),
        });
      } else if (msg.bt_addr === "cf:99:79:62:06:42") {
        // BEACONID: MukIO3
        const filteredRSSI = filteredRssi.MukIO3.filter(msg.rssi);
        setLastMukio3({ ...msg, rssi: filteredRSSI });

        if (blurGainCalculation(msg.rssi) >= 1.0) {
          setMukio3Found(true);
        }

        mukio3Gain.set({
          gain: blurGainCalculation(filteredRSSI),
        });
      } else if (msg.bt_addr === "fb:f3:2f:d2:92:80") {
        // BEACONID: MuEx2Q
        const filteredRSSI = filteredRssi.MuEx2Q.filter(msg.rssi);
        setLastMuex2q({ ...msg, rssi: filteredRSSI });

        if (blurGainCalculation(msg.rssi) >= 1.0) {
          setMuex2qFound(true);
        }

        muex2qGain.set({
          gain: blurGainCalculation(filteredRSSI),
        });
      } else {
        // setLastMsg(msg);
        // console.log(msg.bt_addr);
      }

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
    });
  };

  return (
    <div className={styles.container} ref={fsRef}>
      <Head>
        <title>Magnetoscope - Blur Experiment</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {!soundRegistered ? (
        <div>
          <button
            style={{
              backgroundColor: "black",
              border: "1px solid white",
              opacity: showDebug ? 1 : 0.3,
            }}
            onClick={() => {
              fsRef.current.requestFullscreen();
            }}
          >
            <BsFullscreen />
          </button>
          <button onClick={registerSound}>go to app</button>
        </div>
      ) : (
        <main className={styles.main}>
          {/* DEBUG DATA */}
          <div
            style={{
              position: "fixed",
              top: 0,
              width: "90%",
              maxWidth: "768px",
              justifyContent: "space-between",
              alignItems: "center",
              display: "flex",
              padding: "1.2rem 2rem",
            }}
          >
            <button
              style={{
                backgroundColor: "black",
                border: "1px solid white",
                opacity: showDebug ? 1 : 0.3,
              }}
              onClick={() => {
                fsRef.current.requestFullscreen();
              }}
            >
              <BsFullscreen />
            </button>
            <button
              style={{
                backgroundColor: "black",
                border: "1px solid white",
                opacity: showDebug ? 1 : 0.3,
              }}
              onClick={() => setShowDebug(!showDebug)}
            >
              Show Debug
            </button>
            <div
              style={{
                opacity: showDebug ? 0.7 : 0,
                marginLeft: "3.2rem",
                flexGrow: 1,
                justifyContent: "space-between",
                alignItems: "center",
                display: "flex",
              }}
            >
              <div>
                <b>universe</b>:{" "}
                {blurGainCalculation(lastMukio3?.rssi).toFixed(2) || 0} <br />
                rssi: {lastMukio3?.rssi?.toFixed(2) || 0}
                <br />
                found: {mukio3Found ? "yes" : "no"}
              </div>
              <div>
                <b>world</b>:{" "}
                {blurGainCalculation(lastMutpuc?.rssi).toFixed(2) || 0}
                <br />
                rssi: {lastMutpuc?.rssi?.toFixed(2) || 0}
                <br />
                found: {mutpucFound ? "yes" : "no"}
              </div>
              <div>
                <b>city</b>:{" "}
                {blurGainCalculation(lastMuex2q?.rssi).toFixed(2) || 0}
                <br />
                rssi: {lastMuex2q?.rssi?.toFixed(2) || 0}
                <br />
                found: {muex2qFound ? "yes" : "no"}
              </div>
            </div>
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
            <BlurChildren
              normalizedBlurVal={blurGainCalculation(lastMukio3?.rssi)}
            >
              <h2 style={{ fontSize: "3.2em" }}>Universe</h2>
              <BsCircleFill
                size={250}
                // style={{ fill: mukio3Found ? "green" : "white" }}
              />
            </BlurChildren>
            <BlurChildren
              normalizedBlurVal={blurGainCalculation(lastMutpuc?.rssi)}
            >
              <h2 style={{ fontSize: "3.2em" }}>World</h2>
              <BsSquareFill
                size={250}
                // style={{ fill: mutpucFound ? "green" : "white" }}
              />
            </BlurChildren>
            <BlurChildren
              normalizedBlurVal={blurGainCalculation(lastMuex2q?.rssi)}
            >
              <h2 style={{ fontSize: "3.2em" }}>City</h2>
              <BsTriangleFill
                size={250}
                // style={{ fill: muex2qFound ? "green" : "white" }}
              />
            </BlurChildren>
          </div>
        </main>
      )}
    </div>
  );
}
