"""Create lightweight display copies of every character PNG (originals untouched).

  name.webp        800 px wide, quality 80  -> live preview, poster, profile
  name.thumb.webp  240 px wide, quality 72  -> choice-card thumbnails

PNG originals stay the source of truth and are still used for PNG downloads.
Usage: python3 scripts/make-web-derivatives.py   (skips files already up to date)
"""
import pathlib, sys
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'characters'
made = 0
for png in sorted(root.rglob('*.png')):
    src_mtime = png.stat().st_mtime
    for suffix, width, quality in (('.webp', 800, 80), ('.thumb.webp', 240, 72)):
        out = png.with_name(png.stem + suffix)
        if out.exists() and out.stat().st_mtime >= src_mtime:
            continue
        with Image.open(png) as im:
            im = im.convert('RGB')
            h = round(im.height * width / im.width)
            im.resize((width, h), Image.LANCZOS).save(out, 'WEBP', quality=quality, method=6)
        made += 1
print(f'{made} derivative files written')
