# HISTI Sans SC

A self-hosted Chinese-only regular subset of Noto Sans SC, renamed for this build. The original copyright and SIL Open Font License 1.1 are retained in `OFL.txt` and font metadata. No external font service is used.

Source: https://github.com/google/fonts/blob/67bc647ce1910e92f461bcc82aae30f21d21a9cc/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf

Build: `scripts/subset-chinese-font.py source.ttf` with fontTools and Brotli. Run after generating Chinese HTML to include all visitor and assessment glyphs. Weight 400 is instantiated before subsetting; the browser may synthesize emphasis. Latin text retains Instrument Sans / Tiro Gurmukhi / Idiqlat.
