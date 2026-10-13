#!/usr/bin/env python3
"""Build dist/printing-impact-card.js: the card with its 3D icons and illustrations embedded.

    pip install pillow
    python3 build.py

The artwork in assets/ (dark, light and the night scene) is converted to WebP (icons at 160 px, illustrations at 640 px) and inlined as
data URIs, so the finished card is one file with nothing else to host. Flat icons are SVG and already
live inside the card's source.
"""
import base64
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src' / 'printing-impact-card.js'
DIST = ROOT / 'dist' / 'printing-impact-card.js'
PLACEHOLDER = '/*__EMBEDDED_ASSETS__*/null'

# card key -> file name in assets/<mode>/
FILES = {
    'illustration': 'illustration', 'trees': 'trees', 'co2': 'co2', 'paper_energy': 'paper-energy',
    'bulb_hours': 'bulb-hours', 'sheets_month': 'sheets-this-month', 'sheets_total': 'sheets-total',
    'cost': 'cost',
}
SIZES = {'illustration': 640}
ICON_SIZE = 160


def data_uri(path: Path, size: int) -> str:
    im = Image.open(path).convert('RGBA')
    if im.width != size:
        im = im.resize((size, round(im.height * size / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=86, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')


def main() -> None:
    source = SRC.read_text(encoding='utf-8')
    if PLACEHOLDER not in source:
        raise SystemExit(f'{SRC} has no {PLACEHOLDER} placeholder')
    embedded = {
        mode: {key: data_uri(ROOT / 'assets' / mode / f'{name}.png', SIZES.get(key, ICON_SIZE))
               for key, name in FILES.items()}
        for mode in ('dark', 'light')
    }
    # the night-time scene used when day_night is on
    embedded['night'] = {'illustration': data_uri(ROOT / 'assets' / 'night' / 'illustration.png', SIZES['illustration'])}
    DIST.parent.mkdir(exist_ok=True)
    DIST.write_text(source.replace(PLACEHOLDER, json.dumps(embedded, separators=(',', ':'))), encoding='utf-8')
    print(f'Wrote {DIST.relative_to(ROOT)} ({DIST.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
