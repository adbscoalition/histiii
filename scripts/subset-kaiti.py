"""Subset the user-supplied KaiTi font for the shipped Chinese text. No source writes."""
import argparse
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
text = "".join(p.read_text() for p in (root / "zh").iterdir() if p.suffix in (".js", ".html", ".css"))
text += (root / "app-histi4.js").read_text()
characters = {ord(c) for c in text if 0x3000 <= ord(c) <= 0x9fff or 0xff00 <= ord(c) <= 0xffef}
font = TTFont(args.source)
missing = characters - set(font.getBestCmap())
if missing:
    raise ValueError("Missing source glyphs: " + " ".join(f"U+{c:04X}" for c in sorted(missing)))
options = subset.Options()
options.flavor = "woff2"
options.hinting = False
options.name_IDs = ["*"]
options.name_languages = ["*"]
options.name_legacy = True
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=characters)
subsetter.subset(font)
font.flavor = "woff2"
font.recalcTimestamp = False
args.output.parent.mkdir(parents=True, exist_ok=True)
font.save(args.output)
print(f"{len(characters)} glyphs; {args.output.stat().st_size:,} bytes; original font untouched")
