/**
 * 图片合成工具类
 * 将背景图、配图、主标题、分标题、文案合成为小红书风格图片
 */

interface CompositeImageOptions {
  backgroundImage: string; // 背景图URL
  generatedImage: string; // 生成的配图URL
  mainTitle: string; // 主标题
  subTitle: string; // 分标题
  content: string; // 文案
}

/**
 * 合成图片
 * @param options - 合成选项
 * @returns 合成后的图片DataURL
 */
export async function compositeImage(options: CompositeImageOptions): Promise<string> {
  const { backgroundImage, generatedImage, mainTitle, subTitle, content } = options;

  // 创建Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  // 1. 绘制背景图
  await drawImage(ctx, backgroundImage, 0, 0, 1080, 1920);

  // 2. 绘制半透明遮罩（增强文字可读性）
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, 1080, 1920);

  // 3. 绘制主标题（顶部居中）
  drawText(ctx, mainTitle, {
    x: 540,
    y: 150,
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    align: 'center',
    maxWidth: 960,
    shadow: true,
  });

  // 4. 绘制生成的配图（居中偏上）
  const imageY = 300;
  const imageSize = 600;
  await drawImage(
    ctx,
    generatedImage,
    (1080 - imageSize) / 2,
    imageY,
    imageSize,
    imageSize,
    true // 圆角
  );

  // 5. 绘制分标题（配图下方）
  const subTitleY = imageY + imageSize + 80;
  drawText(ctx, subTitle, {
    x: 540,
    y: subTitleY,
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    align: 'center',
    shadow: true,
  });

  // 6. 绘制文案（分标题下方）
  const contentY = subTitleY + 100;
  drawMultilineText(ctx, content, {
    x: 540,
    y: contentY,
    fontSize: 40,
    color: '#FFFFFF',
    align: 'center',
    maxWidth: 900,
    lineHeight: 60,
    shadow: true,
  });

  // 返回DataURL
  return canvas.toDataURL('image/png');
}

/**
 * 绘制图片
 */
async function drawImage(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rounded: boolean = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      if (rounded) {
        // 绘制圆角矩形
        const radius = 30;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
      }
      
      ctx.drawImage(img, x, y, width, height);
      
      if (rounded) {
        ctx.restore();
      }
      
      resolve();
    };
    
    img.onerror = () => {
      reject(new Error(`图片加载失败: ${src}`));
    };
    
    img.src = src;
  });
}

/**
 * 绘制文本
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    fontSize: number;
    fontWeight?: string;
    color: string;
    align: CanvasTextAlign;
    maxWidth?: number;
    shadow?: boolean;
  }
): void {
  const { x, y, fontSize, fontWeight = 'normal', color, align, maxWidth, shadow } = options;

  ctx.font = `${fontWeight} ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  // 添加阴影
  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }

  // 重置阴影
  if (shadow) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
}

/**
 * 绘制多行文本
 */
function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    fontSize: number;
    color: string;
    align: CanvasTextAlign;
    maxWidth: number;
    lineHeight: number;
    shadow?: boolean;
  }
): void {
  const { x, y, fontSize, color, align, maxWidth, lineHeight, shadow } = options;

  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  // 添加阴影
  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  // 自动换行
  const words = text.split('');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  ctx.fillText(line, x, currentY);

  // 重置阴影
  if (shadow) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
}

/**
 * 下载图片
 * @param dataUrl - 图片DataURL
 * @param filename - 文件名
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
