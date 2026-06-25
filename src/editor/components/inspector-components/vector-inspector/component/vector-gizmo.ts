import { Component, ElementRef, Input, Output, EventEmitter, ViewChild, AfterViewInit, HostListener, OnChanges } from '@angular/core';

@Component({
  selector: 'editor-vector-gizmo',
 template: `<canvas #canvas width="80" height="80" (mousedown)="onMouseDown($event)"></canvas>`,
  styles: [`
    canvas {
      cursor: crosshair;
      border-radius: 50%;
      background: #1e1e1e;
      display: block;
      margin: 10px auto;
    }
  `]
})
export class EditorVectorGizmoComponent implements AfterViewInit, OnChanges {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() z: number = 0;
  
  @Output() valueChange = new EventEmitter<{ index: number, value: number }>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private isDragging = false;
  private dragMode: 'trackball' | 'roll' | null = null;
  private lastMouse = { x: 0, y: 0 };
  private initialAngle = 0;
  private initialZ = 0;

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.drawGizmo();
  }

  ngOnChanges() {
    if (this.ctx) this.drawGizmo();
  }

  onMouseDown(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const cx = event.clientX - rect.left - rect.width / 2;
    const cy = event.clientY - rect.top - rect.height / 2;
    const dist = Math.hypot(cx, cy);

    const outerRadius = rect.width / 2;
    const innerRadius = outerRadius * 0.75;

    if (dist <= innerRadius) {
      this.dragMode = 'trackball';
    } else if (dist <= outerRadius) {
      this.dragMode = 'roll';
      this.initialAngle = Math.atan2(cy, cx);
      this.initialZ = this.z;
    } else {
      return;
    }

    this.isDragging = true;
    this.lastMouse = { x: event.clientX, y: event.clientY };
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const sensitivity = 0.015; 
    if (this.dragMode === 'trackball') {
      const dx = event.clientX - this.lastMouse.x;
      const dy = event.clientY - this.lastMouse.y;
      
      this.valueChange.emit({ index: 0, value: this.x - -dx * sensitivity });
      this.valueChange.emit({ index: 1, value: this.y - dy * sensitivity });
      
      this.lastMouse = { x: event.clientX, y: event.clientY };
    } else if (this.dragMode === 'roll') {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const cx = event.clientX - rect.left - rect.width / 2* sensitivity;
      const cy = event.clientY - rect.top - rect.height / 2* sensitivity;
      
      let angleDiff = Math.atan2(cy, cx) - this.initialAngle;
      
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      const degrees = angleDiff * (180 / Math.PI);
      this.valueChange.emit({ index: 2, value: this.initialZ - degrees });
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.dragMode = null;
  }

  private drawGizmo() {
    const width = this.canvasRef.nativeElement.width;
    const height = this.canvasRef.nativeElement.height;
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = cx - 2;
    const innerRadius = outerRadius * 0.75;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#333';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#222';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(this.z * (Math.PI / 180));
    this.ctx.beginPath();
    this.ctx.moveTo(0, -innerRadius);
    this.ctx.lineTo(0, -outerRadius);
    this.ctx.strokeStyle = '#ffaa00';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    this.ctx.restore();
  }
}