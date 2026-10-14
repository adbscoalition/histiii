"""Build the self-hosted Chinese-only regular face from a pinned Noto Sans SC source.

Usage: PYTHONPATH=<fonttools> python scripts/subset-chinese-font.py source.ttf
Binary font compilation only. No assessment or HTML source is modified.
"""
import re
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

root = Path(__file__).resolve().parent.parent
characters = set()
for path in (root / "zh").iterdir():
    if path.suffix in {".js", ".html", ".css"}:
        characters.update(re.findall(r"[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]", path.read_text()))
font = instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 400}, inplace=True)
options = subset.Options()
options.flavor = "woff2"
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
options.name_legacy = True
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=[ord(c) for c in characters])
subsetter.subset(font)
for record in font["name"].names:
    names = {1: "HISTI Sans SC", 2: "Regular", 3: "HISTI Sans SC Chinese subset 1.0", 4: "HISTI Sans SC Regular", 6: "HISTISansSC-Regular"}
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.flavor = "woff2"
font.recalcTimestamp = False
target = root / "fonts" / "noto-sans-sc" / "zh-subset.woff2"
font.save(target)
print(f"{len(characters)} Chinese characters; {target.stat().st_size:,} bytes")
