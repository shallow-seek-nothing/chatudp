# Assets / 素材

## Logo / 标志

- `logo.png` — original line art, 2136×2136 PNG, white background, blue strokes.
  / 原始线稿，2136×2136 PNG，白底蓝线。
- `make-logo.py` — removes the white background and tints the fish **cyber green** (`#00FF9C`).
  Generates `public/assets/logo.png` (512×512, transparent) and `public/assets/favicon.png` (64×64).
  / 抠掉白底并把翻车鱼染成赛博绿（`#00FF9C`），生成 `public/assets/logo.png`（512×512，透明）
  和 `public/assets/favicon.png`（64×64）。
- Screenshots of the UI are in `docs/`. / 界面截图在 `docs/`.

## License / 许可证

- **The Mola fish logo artwork** (`logo.png` and every derivative in `public/assets/`) is dedicated to
  the public domain under **CC0 1.0**. Use it, remix it, print it on a T-shirt, feed it to a jellyfish —
  no permission needed. See [LICENSE](LICENSE).
  / **翻车鱼标志素材**（`logo.png` 及 `public/assets/` 里的所有衍生版本）以 **CC0 1.0** 公有领域发布。
  随意使用、二创、印 T 恤、喂水母，无需授权。见 [LICENSE](LICENSE)。
- `make-logo.py` is MIT, same as the rest of the project. / 脚本与项目其余部分一样是 MIT。

## Regenerate / 重新生成

```bash
pip install pillow numpy
python make-logo.py
```

Requires Python 3 with Pillow and NumPy. / 需要带 Pillow 和 NumPy 的 Python 3。
