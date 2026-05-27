import { Player, Lineup } from './types';
import { getRarity } from './game-logic';

type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

const RARITY_BG: Record<Rarity, [string, string]> = {
  N: ['#4ade80', '#15803d'],
  R: ['#60a5fa', '#1d4ed8'],
  SR: ['#a855f7', '#6b21a8'],
  SSR: ['#facc15', '#ea580c'],
  UR: ['#f472b6', '#dc2626'],
};

const STAT_LABELS: Record<string, string> = {
  SHO: '投射', SLA: '突破', DEF: '防守',
  ATH: '运动', PLM: '组织', PHY: '对抗',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  player: Player,
) {
  const rarity = getRarity(player) as Rarity;
  const [c1, c2] = RARITY_BG[rarity];

  // Card background gradient
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = grad;
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Jersey number (faded)
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.font = `bold ${h * 0.45}px "Arial Black", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(player.jersey_number), x + w / 2, y + h * 0.38);

  // OVR badge top-left
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, x + 6, y + 6, 36, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(player.ovr), x + 24, y + 15);

  // Position top-right
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, x + w - 34, y + 6, 28, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Arial';
  ctx.fillText(player.position, x + w - 20, y + 15);

  // Name at bottom
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Arial';
  ctx.textBaseline = 'bottom';
  ctx.fillText(player.name_en, x + w / 2, y + h - 6);
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: {
  font?: string; color?: string | CanvasGradient; align?: CanvasTextAlign; baseline?: CanvasTextBaseline;
}) {
  ctx.fillStyle = opts.color || '#fff';
  ctx.font = opts.font || '14px Arial';
  ctx.textAlign = opts.align || 'left';
  ctx.textBaseline = opts.baseline || 'top';
  ctx.fillText(text, x, y);
}

export async function generateLineupPoster(opts: {
  nickname: string;
  lineup: Lineup;
  score: number;
  qrDataUrl: string;
}): Promise<string> {
  const W = 600, H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, W, H);

  // Title gradient
  const titleGrad = ctx.createLinearGradient(120, 40, 480, 40);
  titleGrad.addColorStop(0, '#facc15');
  titleGrad.addColorStop(0.5, '#f97316');
  titleGrad.addColorStop(1, '#ef4444');
  drawText(ctx, 'NBA 最佳阵容对战', W / 2, 30, {
    font: 'bold 32px "Arial Black", sans-serif', color: titleGrad, align: 'center',
  });

  // Nickname
  if (opts.nickname) {
    drawText(ctx, `🏀 ${opts.nickname}`, W / 2, 72, {
      font: 'bold 16px Arial', color: '#9ca3af', align: 'center',
    });
  }

  // Score badge
  const badgeW = 100, badgeH = 40;
  ctx.fillStyle = '#000';
  roundRect(ctx, W / 2 - badgeW / 2, 100, badgeW, badgeH, 10);
  ctx.fill();
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.stroke();
  drawText(ctx, '战力', W / 2 - 20, 107, { font: 'bold 11px Arial', color: '#9ca3af' });
  drawText(ctx, String(opts.score), W / 2 + 20, 108, {
    font: 'bold 20px Arial', color: '#fff', align: 'center',
  });

  // Cards in diamond layout
  const cw = 90, ch = 130, gap = 16;
  const positions: { pos: string; col: number; row: number }[] = [
    { pos: 'PF', col: 0, row: 0 }, { pos: 'SF', col: 1, row: 0 },
    { pos: 'C', col: 0.5, row: 1 },
    { pos: 'PG', col: 0, row: 2 }, { pos: 'SG', col: 1, row: 2 },
  ];

  const startY = 160;
  for (const { pos, col, row } of positions) {
    const player = opts.lineup[pos as keyof Lineup] as Player | null;
    if (!player) continue;
    const x = W / 2 - cw - gap / 2 + col * (cw + gap);
    const y = startY + row * (ch + gap);
    drawCard(ctx, x, y, cw, ch, player);
    // Position label below card
    drawText(ctx, pos, x + cw / 2, y + ch + 4, {
      font: 'bold 12px Arial', color: '#fff', align: 'center',
    });
  }

  // Stats bars
  const players = Object.values(opts.lineup).filter(Boolean) as Player[];
  const statKeys = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY'] as const;
  const barStartY = startY + 3 * (ch + gap) + 20;
  drawText(ctx, '阵容属性', W / 2, barStartY, {
    font: 'bold 14px Arial', color: '#fff', align: 'center',
  });

  for (let i = 0; i < statKeys.length; i++) {
    const key = statKeys[i];
    const avg = Math.round(players.reduce((s, p) => s + p.stats[key], 0) / 5);
    const barY = barStartY + 24 + i * 24;
    const barX = 80, barW = 360, barH = 14;

    drawText(ctx, STAT_LABELS[key], barX - 4, barY, {
      font: 'bold 12px Arial', color: '#9ca3af', align: 'right',
    });

    ctx.fillStyle = '#1f2937';
    roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    const fillW = barW * (avg / 100);
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    barGrad.addColorStop(0, '#3b82f6');
    barGrad.addColorStop(1, '#8b5cf6');
    roundRect(ctx, barX, barY, fillW, barH, 4);
    ctx.fillStyle = barGrad;
    ctx.fill();

    drawText(ctx, String(avg), barX + barW + 8, barY + 1, {
      font: 'bold 12px Arial', color: '#d1d5db',
    });
  }

  // Footer with QR code
  const footerY = H - 70;
  drawText(ctx, 'NBA 最佳阵容对战', 24, footerY, {
    font: 'bold 14px Arial', color: '#fff',
  });
  drawText(ctx, '虎扑JRS · 开包抽卡 · 组建阵容 · 统治赛场', 24, footerY + 22, {
    font: '11px Arial', color: '#6b7280',
  });

  if (opts.qrDataUrl) {
    const qrImg = new Image();
    qrImg.src = opts.qrDataUrl;
    await new Promise<void>(resolve => { qrImg.onload = () => resolve(); qrImg.onerror = () => resolve(); });
    ctx.drawImage(qrImg, W - 80, footerY - 10, 60, 60);
    drawText(ctx, '扫码参与', W - 50, footerY + 54, {
      font: '10px Arial', color: '#6b7280', align: 'center',
    });
  }

  return canvas.toDataURL('image/png');
}

export async function generateBattlePoster(opts: {
  challengerNickname: string;
  defenderNickname: string;
  challengerScore: number;
  defenderScore: number;
  winner: 'challenger' | 'defender' | 'draw';
  positionMatchups: Array<{
    position: string;
    challenger: Player;
    defender: Player;
    challengerScore: number;
    defenderScore: number;
    winner: string;
  }>;
  qrDataUrl: string;
}): Promise<string> {
  const W = 600, H = 1060;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, W, H);

  // Win/Loss banner
  const isWin = opts.winner === 'challenger';
  const isDraw = opts.winner === 'draw';
  const bannerText = isWin ? '胜利!' : isDraw ? '平局' : '失败';
  const bannerColor = isWin ? '#facc15' : isDraw ? '#9ca3af' : '#f87171';

  drawText(ctx, bannerText, W / 2, 20, {
    font: 'bold 42px "Arial Black", sans-serif', color: bannerColor, align: 'center',
  });

  // Score comparison
  const scoreY = 80;
  drawText(ctx, '我方', W / 2 - 100, scoreY, { font: 'bold 12px Arial', color: '#9ca3af', align: 'center' });
  drawText(ctx, opts.challengerNickname, W / 2 - 100, scoreY + 18, { font: 'bold 13px Arial', color: '#60a5fa', align: 'center' });
  drawText(ctx, String(opts.challengerScore), W / 2 - 100, scoreY + 38, {
    font: 'bold 28px Arial', color: isWin ? '#facc15' : '#fff', align: 'center',
  });

  drawText(ctx, 'VS', W / 2, scoreY + 30, { font: 'bold 18px Arial', color: '#4b5563', align: 'center' });

  drawText(ctx, '对方', W / 2 + 100, scoreY, { font: 'bold 12px Arial', color: '#9ca3af', align: 'center' });
  drawText(ctx, opts.defenderNickname, W / 2 + 100, scoreY + 18, { font: 'bold 13px Arial', color: '#f87171', align: 'center' });
  drawText(ctx, String(opts.defenderScore), W / 2 + 100, scoreY + 38, {
    font: 'bold 28px Arial', color: !isWin && !isDraw ? '#facc15' : '#fff', align: 'center',
  });

  // Position matchups
  const cardW = 75, cardH = 105;
  const matchupStartY = 155;

  for (let i = 0; i < opts.positionMatchups.length; i++) {
    const m = opts.positionMatchups[i];
    const y = matchupStartY + i * (cardH + 30);

    // Background card
    const isChallengerWin = m.winner === 'challenger';
    const isDefenderWin = m.winner === 'defender';
    ctx.fillStyle = '#1f2937';
    roundRect(ctx, 20, y - 4, W - 40, cardH + 26, 10);
    ctx.fill();
    ctx.strokeStyle = isChallengerWin ? 'rgba(59,130,246,0.5)' : isDefenderWin ? 'rgba(239,68,68,0.5)' : '#374151';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Position & result label
    drawText(ctx, m.position, W / 2, y, {
      font: 'bold 10px Arial', color: '#6b7280', align: 'center',
    });
    const resultText = isChallengerWin ? '我方胜' : isDefenderWin ? '对方胜' : '平局';
    const resultColor = isChallengerWin ? '#60a5fa' : isDefenderWin ? '#f87171' : '#6b7280';
    drawText(ctx, resultText, W / 2 + 26, y, { font: 'bold 10px Arial', color: resultColor });

    // Challenger card
    drawCard(ctx, 50, y + 14, cardW, cardH, m.challenger);

    // VS
    drawText(ctx, 'VS', W / 2, y + 14 + cardH / 2, {
      font: 'bold 12px Arial', color: '#4b5563', align: 'center', baseline: 'middle',
    });

    // Defender card
    drawCard(ctx, W - 50 - cardW, y + 14, cardW, cardH, m.defender);
  }

  // Footer with QR code
  const footerY = H - 70;
  drawText(ctx, 'NBA 最佳阵容对战', 24, footerY, { font: 'bold 14px Arial', color: '#fff' });
  drawText(ctx, '虎扑JRS · 开包抽卡 · 组建阵容 · 统治赛场', 24, footerY + 22, {
    font: '11px Arial', color: '#6b7280',
  });

  if (opts.qrDataUrl) {
    const qrImg = new Image();
    qrImg.src = opts.qrDataUrl;
    await new Promise<void>(resolve => { qrImg.onload = () => resolve(); qrImg.onerror = () => resolve(); });
    ctx.drawImage(qrImg, W - 80, footerY - 10, 60, 60);
    drawText(ctx, '扫码参与', W - 50, footerY + 54, {
      font: '10px Arial', color: '#6b7280', align: 'center',
    });
  }

  return canvas.toDataURL('image/png');
}
