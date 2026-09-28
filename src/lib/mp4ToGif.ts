import * as gifencLib from "gifenc";

type Palette = number[][];
interface Encoder {
  writeFrame(index: Uint8Array, width: number, height: number, opts: { palette: Palette; delay: number; repeat?: number }): void;
  finish(): void;
  bytes(): Uint8Array;
}
interface Gifenc {
  GIFEncoder(): Encoder;
  quantize(rgba: Uint8ClampedArray, maxColors: number): Palette;
  applyPalette(rgba: Uint8ClampedArray, palette: Palette): Uint8Array;
}
const { GIFEncoder, quantize, applyPalette } = gifencLib as unknown as Gifenc;

const MAX_SECONDS = 6;
const TARGET = 5 * 1024 * 1024;
const HARD_LIMIT = 10 * 1024 * 1024;
const CONFIGS = [
  { width: 400, fps: 10 },
  { width: 320, fps: 8 },
  { width: 240, fps: 8 },
];

const waitEvent = (el: HTMLVideoElement, ev: string) =>
  new Promise<void>((resolve, reject) => {
    const ok = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error("Não foi possível ler o vídeo.")); };
    const cleanup = () => { el.removeEventListener(ev, ok); el.removeEventListener("error", fail); };
    el.addEventListener(ev, ok);
    el.addEventListener("error", fail);
  });

export async function mp4ToGif(file: File, onProgress?: (pct: number) => void): Promise<File> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.style.position = "fixed";
  video.style.left = "-99999px";
  try {
    const meta = waitEvent(video, "loadedmetadata");
    video.src = url;
    await meta;
    const duration = Math.min(video.duration || 0, MAX_SECONDS);
    if (!duration || !video.videoWidth) throw new Error("Não foi possível ler o vídeo.");

    let lastBytes: Uint8Array | null = null;
    for (let c = 0; c < CONFIGS.length; c++) {
      const { width: maxW, fps } = CONFIGS[c];
      const width = Math.min(maxW, video.videoWidth);
      const height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * width));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas indisponível.");

      const total = Math.max(1, Math.floor(duration * fps));
      const gif = GIFEncoder();
      for (let i = 0; i < total; i++) {
        const seeked = waitEvent(video, "seeked");
        video.currentTime = i / fps;
        await seeked;
        ctx.drawImage(video, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, width, height, { palette, delay: 1000 / fps, repeat: 0 });
        onProgress?.(Math.round(((c + (i + 1) / total) / CONFIGS.length) * 100));
      }
      gif.finish();
      const bytes = gif.bytes();
      lastBytes = bytes;
      if (bytes.length <= TARGET) break;
    }

    if (!lastBytes || lastBytes.length > HARD_LIMIT) {
      throw new Error("O GIF ficou grande demais. Use um vídeo mais curto ou mais simples.");
    }
    onProgress?.(100);
    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([new Uint8Array(lastBytes)], base + ".gif", { type: "image/gif" });
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
