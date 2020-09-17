import React, { createRef, Component } from "react";
import Oscilloscope from "./oscilloscope/oscilloscope";
import styled from "styled-components";
import {
  Player,
  Analyser,
  Destination,
  PitchShift,
  PingPongDelay,
  Reverb,
} from "tone";

const StyledOscilloscopeWrap = styled.div`
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: black;
`;

export default class OscilloscopeCanvas extends Component {
  oscilloscopeRef = createRef<HTMLCanvasElement>();
  ctx: RenderingContext;
  player: Player;

  componentDidMount() {
    this.ctx = this.oscilloscopeRef.current.getContext("2d");
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "#00FF41";
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = "#003B00";

    // {
    //   earth: "/audio/earth.wav",
    //   // "/audio/moon.wav",
    //   // "/audio/sulfur.wav",
    //   // "/audio/sun.wav",
    // },

    this.player = new Player({
      url: "/audio/earth.wav",
      loop: true,
      autostart: true,
    });

    //pitch shift the frequency of the incoming signal
    const fx1 = new PitchShift(10);
    const fx2 = new PingPongDelay(4);
    const fx3 = new Reverb(2);
    const chain = this.player.chain(fx1, fx2, fx3, Destination);

    fx1.set({ pitch: 0 });
    fx2.set({ delayTime: 0 });
    fx3.set({ decay: 2 });
    //analyse the frequency/amplitude of the incoming signal
    var fft = new Analyser("fft", 4096);
    chain.fan(fft);

    const scope = new Oscilloscope(fft);
    scope.animate(this.ctx, 600, 600);
  }

  componentWillUnmount() {
    this.player.stop();
  }

  render() {
    return (
      <StyledOscilloscopeWrap>
        <canvas ref={this.oscilloscopeRef} height="1200" width="1200"></canvas>
      </StyledOscilloscopeWrap>
    );
  }
}
