import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { AudioService } from '@editor/services/audio.service';

@Component({
  selector: 'app-oscilloscope',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oscilloscope-container">
      <canvas #oscilloscopeCanvas class="oscilloscope-canvas"></canvas>
    </div>
  `,
  styleUrl: './oscilloscope.component.scss'
})
export class OscilloscopeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('oscilloscopeCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private audioService = inject(AudioService);
  private animationId: number | null = null;
  private analyser: AnalyserNode | null = null;

  constructor() {
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  ngAfterViewInit() {
    this.analyser = this.audioService.getAnalyserNode();
    this.resizeCanvas();
    this.start();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }

  private resizeCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }

  private start() {
    if (!this.analyser || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const computedStyles = window.getComputedStyle(canvas);
    const bgFill = computedStyles.getPropertyValue('--canvas-bg').trim() || '#0f111a';
    const strokeColor = computedStyles.getPropertyValue('--canvas-stroke').trim() || '#82aaff';

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      
      if (!this.analyser) return;
      this.analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }
}