"""Prepare user-supplied math illustrations; preserve originals."""
from pathlib import Path
from PIL import Image, ImageOps
import json
ROOT=Path(__file__).resolve().parents[1]
items=[('pp9zoo','journey-math'),('ek2n56','math-shopping'),('gw5vup','math-stage-2'),('7mu605','math-counting'),('7rkl27','math-clock'),('725swq','math-solids'),('p8idvi','math-shapes'),('qpep2','math-measuring'),('wd9ud','math-fractions'),('l75ayl','math-sharing')]
for prefix,name in items:
    source=next(p for p in sorted((ROOT/'anh').glob('*_'+prefix+'*.png')) if ' (1)' not in p.name)
    im=ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    im.thumbnail((960,960),Image.Resampling.LANCZOS)
    im.save(ROOT/'assets/art'/f'{name}.webp',quality=88,method=6)
(ROOT/'math-art.mjs').write_text('export const mathArtNames = '+json.dumps([name for _,name in items])+';\n',encoding='utf-8')
print('Prepared 10 math illustrations')
