"""Utility script to generate branded PWA icons for the DeTrust web app."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "apps" / "web" / "public" / "icons"
ICONS_DIR.mkdir(parents=True, exist_ok=True)

BRAND_START = (9, 12, 23)
BRAND_END = (52, 211, 153)
ACCENT = (9, 102, 73)
GLOW = (255, 255, 255, 45)

SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512]


def lerp(start: int, end: int, t: float) -> int:
    return int(start + (end - start) * t)


def create_base(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BRAND_START)
    pixels = img.load()

    for y in range(size):
        t = y / (size - 1)
        r = lerp(BRAND_START[0], BRAND_END[0], t)
        g = lerp(BRAND_START[1], BRAND_END[1], t)
        b = lerp(BRAND_START[2], BRAND_END[2], t)
        for x in range(size):
            pixels[x, y] = (r, g, b, 255)

    draw = ImageDraw.Draw(img)
    padding = int(size * 0.16)
    radius = int(size * 0.28)
    draw.rounded_rectangle(
        (padding, padding, size - padding, size - padding),
        radius=radius,
        outline=(255, 255, 255, 120),
        width=max(2, size // 40),
        fill=(10, 15, 20, 120),
    )

    inner_padding = int(size * 0.28)
    draw.rounded_rectangle(
        (inner_padding, padding, size - padding // 2, size - padding),
        radius=radius,
        fill=(255, 255, 255, 35),
    )

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_radius = int(size * 0.42)
    glow_draw.ellipse(
        (
            size // 2 - glow_radius // 2,
            size // 2 - glow_radius // 2,
            size // 2 + glow_radius // 2,
            size // 2 + glow_radius // 2,
        ),
        fill=(52, 211, 153, 65),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.08))
    img = Image.alpha_composite(img, glow)

    highlight = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    highlight_draw = ImageDraw.Draw(highlight)
    highlight_draw.rounded_rectangle(
        (
            padding,
            int(padding * 0.6),
            size - padding,
            int(size * 0.55),
        ),
        radius=int(size * 0.25),
        fill=(255, 255, 255, 40),
    )
    highlight = highlight.filter(ImageFilter.GaussianBlur(radius=size * 0.04))
    img = Image.alpha_composite(img, highlight)

    bar_width = int(size * 0.14)
    bar_padding = int(size * 0.22)
    draw.rounded_rectangle(
        (
            bar_padding,
            bar_padding,
            bar_padding + bar_width,
            size - bar_padding,
        ),
        radius=bar_width // 2,
        fill=(255, 255, 255, 200),
    )

    arc_box = (
        bar_padding - bar_width // 2,
        bar_padding,
        size - bar_padding,
        size - bar_padding,
    )
    draw.pieslice(arc_box, start=300, end=60, fill=None, outline=(255, 255, 255, 220), width=max(3, size // 36))

    dot_radius = int(size * 0.08)
    draw.ellipse(
        (
            size - padding - dot_radius * 2,
            size // 2 - dot_radius,
            size - padding,
            size // 2 + dot_radius,
        ),
        fill=(255, 255, 255, 220),
    )

    return img


def main() -> None:
    base = create_base(1024)
    for size in SIZES:
        resized = base.resize((size, size), Image.Resampling.LANCZOS)
        target = ICONS_DIR / f"icon-{size}x{size}.png"
        resized.save(target, format="PNG")
        print(f"Saved {target.relative_to(ROOT)}")

    favicon_sizes = [16, 32, 48, 64]
    favicon_images = [base.resize((s, s), Image.Resampling.LANCZOS) for s in favicon_sizes]
    favicon_path = ICONS_DIR / "favicon.ico"
    favicon_images[0].save(
        favicon_path,
        format="ICO",
        sizes=[(s, s) for s in favicon_sizes],
    )
    print(f"Saved {favicon_path.relative_to(ROOT)}")

    apple_touch = base.resize((180, 180), Image.Resampling.LANCZOS)
    apple_touch_path = ICONS_DIR / "apple-touch-icon.png"
    apple_touch.save(apple_touch_path, format="PNG")
    print(f"Saved {apple_touch_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
