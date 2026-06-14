#!/usr/bin/env python3
# SAYLOR snake loop (MP4): the 128 drop tokens cascade like a snake. Each token ~1/3 of canvas height
# pops in every INTERVAL seconds, the next overlapping most of the previous; left->right, snake down
# row by row (3 rows tile the height). A sliding window keeps at most WINDOW tokens alive — when the
# 11th appears the 1st vanishes. After the 3rd row the snake slides off the bottom edge -> empty ->
# seamless loop. Black background with a faint live grain.
import os, sys, subprocess
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG  = f'{ROOT}/drop/saylor/img'
OUT  = f'{ROOT}/banners/saylor_snake.mp4'

W, H      = 1920, 1080
TH        = H // 3                 # token height ~ 1/3 of canvas
TW        = int(TH * 0.75)         # 3:4 portrait
N         = 128
PER_ROW   = 40                     # tokens per row (3 rows tile the height; row 4 = off-bottom exit)
WINDOW    = 10                     # max tokens alive at once
INTERVAL  = float(sys.argv[1]) if len(sys.argv) > 1 else 0.5   # seconds between pops
FPS       = 12
FPP       = max(1, round(INTERVAL * FPS))    # frames per pop
STEP      = (W - TW) / (PER_ROW - 1)         # horizontal advance (overlap ~ 1 - STEP/TW)
BG        = (8, 8, 9)

def pos(i):                        # center (x,y) of token i along the boustrophedon snake path
    row = i // PER_ROW
    c   = i % PER_ROW
    if row % 2: c = PER_ROW - 1 - c            # snake: odd rows go right->left
    x = TW / 2 + c * STEP
    y = TH / 2 + row * TH                       # rows 0,1,2 tile [0,H]; row 3 is off-bottom (exit)
    return x, y

def load_tokens():
    toks = []
    for k in range(1, N + 1):
        im = Image.open(f'{IMG}/{k}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
        toks.append(im)
    return toks

def main():
    toks = load_tokens()
    overlap = 1 - STEP / TW
    steps = N + WINDOW             # placements + tail vanish
    total = steps * FPP
    print(f'snake: {N} tokens, {TW}x{TH}, overlap {overlap:.0%}, {INTERVAL}s/pop, '
          f'{FPS}fps -> {total} frames ({total/FPS:.1f}s)')

    ff = subprocess.Popen(
        ['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pixel_format','rgb24',
         '-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-',
         '-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart', OUT],
        stdin=subprocess.PIPE)

    rng = np.random.default_rng(7)
    noise_n = int(W * H * 0.004)
    for s in range(steps):
        cv = Image.new('RGB', (W, H), BG)
        lo = max(0, s - WINDOW + 1)
        for i in range(lo, min(s, N - 1) + 1):          # oldest..newest -> newest pasted on top
            x, y = pos(i)
            cv.paste(toks[i], (int(x - TW/2), int(y - TH/2)))
        fr = np.asarray(cv).copy()
        ys = rng.integers(0, H, noise_n); xs = rng.integers(0, W, noise_n)   # grain refreshes once per pop
        g = rng.integers(18, 64, noise_n); white = rng.random(noise_n) < 0.05
        fr[ys, xs] = np.where(white[:,None], 220, g[:,None])
        buf = fr.tobytes()
        for _ in range(FPP):                            # hold the pop -> identical frames compress to ~0
            ff.stdin.write(buf)
        if s % 16 == 0: print(f'  step {s}/{steps}')
    ff.stdin.close(); ff.wait()
    print('wrote', OUT, f'({os.path.getsize(OUT)//1024} KB)')

if __name__ == '__main__':
    main()
