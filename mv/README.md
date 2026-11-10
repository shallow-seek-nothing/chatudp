# 🎬 Packet dropped! 丢包啦！— MV / 音乐视频

The official music video for `chatudp`. The landing page is the stage: the big headline
(`Drift shallow. Seek nothing.` / `浅层无求，浮游之境。`) is replaced by the lyrics, one line at a time,
synced to the song.

`chatudp` 的官方 MV。舞台就是网站首页：大标题的位置换成歌词，逐句跟着音乐出现。

**Watch on Bilibili / 在 B 站观看:** <https://www.bilibili.com/video/BV185WL6HEM6>

## Files / 文件

| File / 文件 | Notes / 说明 |
| --- | --- |
| [`chatudp-mv.mp4`](chatudp-mv.mp4) | 1920×1080, 30 fps, H.264 + AAC, **02:13.44**, 19.2 MB |
| [`packet-dropped-final.wav`](packet-dropped-final.wav) | original audio / 原始音频, 48 kHz stereo, 25.6 MB |
| [`packet-dropped.srt`](packet-dropped.srt) | lyrics subtitles / 歌词字幕, 33 cues |
| [`cover-16x9.png`](cover-16x9.png) | cover, 1920×1080 / 封面 16:9 |
| [`cover-4x3.png`](cover-4x3.png) | cover, 1440×1080 / 封面 4:3 |

## How it was made / 制作方式

- The lyrics render where the landing-page headline sits; section labels (INTRO / VERSE / CHORUS /
  BRIDGE / OUTRO), the green chorus lines, the mono "system" lines and the faint fish watermark all
  come from the site's visual language.
  歌词渲染在首页大标题的位置；INTRO / VERSE / CHORUS / BRIDGE / OUTRO 段落标签、副歌绿字、
  等宽系统句、淡淡的翻车鱼水印，全部沿用网站视觉。
- 4004 frames were rendered at 30 fps through headless Edge + CDP, then muxed with the WAV using
  ffmpeg. Timings come from the lyrics timeline CSV.
  用无头 Edge + CDP 按 30 fps 逐帧渲染 4004 帧，再用 ffmpeg 与 WAV 合成；时间轴来自歌词 CSV。
- No AI video generation was used. It is HTML, CSS, a canvas particle layer, and ffmpeg.
  没有用 AI 生成视频，只有 HTML / CSS / canvas 粒子和 ffmpeg。

## License / 授权

Words, music, video and covers are part of the open-source `chatudp` release and are published under
**CC0 1.0** (public domain), same as the documentation.
词、曲、MV 与封面随 `chatudp` 开源发布，和文档一样以 **CC0 1.0**（公有领域）授权。
