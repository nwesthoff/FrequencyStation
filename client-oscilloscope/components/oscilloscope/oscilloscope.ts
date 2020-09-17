import { Analyser } from "tone";

export default class Oscilloscope {
  analyserX: AnalyserNode;
  analyserY: AnalyserNode;
  timeDomainX: Float32Array;
  timeDomainY: Float32Array;
  drawRequest: number;
  ctx: CanvasRenderingContext2D;

  constructor(source: Analyser) {
    var gainNodeX = source.context.createGain();
    var gainNodeY = source.context.createGain();

    const splitter = source.context.createChannelSplitter(2);
    splitter.connect(gainNodeX, 0);
    splitter.connect(gainNodeY, 1);
    this.analyserX = gainNodeX.context.createAnalyser();
    this.analyserY = gainNodeY.context.createAnalyser();

    source.connect(this.analyserX);
    source.connect(this.analyserY);

    this.timeDomainX = new Float32Array(this.analyserX.fftSize);
    this.timeDomainY = new Float32Array(this.analyserY.fftSize);
    this.drawRequest = 0;
  }

  // begin default signal animation
  animate(ctx, width?: number, height?: number) {
    if (this.drawRequest) {
      throw new Error("Oscilloscope animation is already running");
    }
    this.ctx = ctx;
    const x0 = width / 2;
    const y0 = height / 2;

    const drawLoop = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      this.draw(ctx, x0, y0, width, height);
      this.drawRequest = window.requestAnimationFrame(drawLoop);
    };
    drawLoop();
  }

  // stop default signal animation
  stop() {
    if (this.drawRequest) {
      window.cancelAnimationFrame(this.drawRequest);
      this.drawRequest = 0;
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
  }

  // draw signal
  draw(
    ctx,
    x0: number,
    y0: number,
    width = ctx.canvas.width,
    height = ctx.canvas.height
  ) {
    this.analyserX.getFloatTimeDomainData(this.timeDomainX);
    this.analyserY.getFloatTimeDomainData(this.timeDomainY);

    ctx.beginPath();

    this.timeDomainX.forEach((value, i) => {
      const percentX = this.timeDomainX[i];
      const percentY = this.timeDomainY[i];
      const x = x0 + width * percentX;
      const y = y0 + height * percentY;

      if (i) {
        ctx.lineTo(x, y);
      } else {
        ctx.moveTo(x, y);
      }
    });

    ctx.stroke();
  }
}
