from pathlib import Path
import sys

from PIL import Image


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: generate-favicons.py <source-image>")
        return 1

    source = Path(sys.argv[1])
    if not source.exists():
        print(f"Source image not found: {source}")
        return 1

    root = Path(__file__).resolve().parents[1]
    image = Image.open(source).convert("RGBA")

    width, height = image.size
    if width != height:
        size = max(width, height)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.alpha_composite(image, ((size - width) // 2, (size - height) // 2))
        image = canvas

    outputs = {
        "favicon-32x32.png": 32,
        "favicon-48x48.png": 48,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }

    for filename, size in outputs.items():
        resized = image.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(root / filename, optimize=True)

    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    image.save(root / "favicon.ico", sizes=ico_sizes)

    source_copy = root / "assets" / "kyunolab-crow-icon.png"
    source_copy.parent.mkdir(exist_ok=True)
    image.save(source_copy, optimize=True)

    print("Generated favicon.ico, favicon PNGs, apple touch icon, and source asset.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
