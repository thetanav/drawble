import { getStroke } from 'perfect-freehand';

export function getSvgPathFromStroke(stroke: { x: number; y: number }[]): string {
  if (stroke.length === 0) return '';
  if (stroke.length === 1) {
    const p = stroke[0];
    return `M ${p.x} ${p.y} L ${p.x} ${p.y}`;
  }

  let d = `M ${stroke[0].x} ${stroke[0].y}`;

  for (let i = 1; i < stroke.length - 1; i++) {
    const p1 = stroke[i];
    const p2 = stroke[i + 1];
    const cx2 = (p1.x + p2.x) / 2;
    const cy2 = (p1.y + p2.y) / 2;
    d += ` Q ${p1.x} ${p1.y} ${cx2} ${cy2}`;
  }

  const last = stroke[stroke.length - 1];
  d += ` L ${last.x} ${last.y}`;

  return d;
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  width: number
) {
  const outlinePoints = getStroke(points, {
    size: width,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });

  if (outlinePoints.length < 2) return;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);

  for (let i = 1; i < outlinePoints.length - 1; i++) {
    const p0 = outlinePoints[i];
    const p1 = outlinePoints[i + 1];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    ctx.quadraticCurveTo(p0[0], p0[1], mx, my);
  }

  const last = outlinePoints[outlinePoints.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.closePath();
  ctx.fill();
}
