"""Derive exact counts from the first cube of the supplied six-cube picture."""
from pathlib import Path
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
im=Image.open(ROOT/'assets/art/math-counting.webp').convert('RGB')
crop=im.crop((0,0,im.width//3,im.height//2))
mask=Image.new('L',crop.size)
mask.putdata([255 if g>r*1.08 and g>b*1.04 and min(r,g,b)<225 else 0 for r,g,b in crop.getdata()])
box=mask.getbbox()
if not box:raise ValueError('Cube not found')
cube=ImageOps.contain(crop.crop(box),(125,150),Image.Resampling.LANCZOS)
out=ROOT/'assets/fun/math';out.mkdir(parents=True,exist_ok=True)
for n in range(1,7):
    canvas=Image.new('RGB',(480,360),'#FAF8F2')
    for i in range(n):canvas.paste(cube,(30+i%3*145,30+i//3*165))
    canvas.save(out/f'count-{n}.webp',quality=88)
