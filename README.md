# Custom H264 AAC German – Tdarr Plugin

## Zweck

Das Plugin konvertiert ausgewählte Video-Codecs per Intel Quick Sync Video (QSV) nach H.264 und verarbeitet gleichzeitig die deutschen Audiospuren.

Ziel ist eine möglichst hohe Direct-Play-Kompatibilität für Jellyfin, insbesondere für Webclients und Android TV.

---

## Aktuelle Funktionen

### Video

Das Plugin kann frei konfiguriert werden, welche Video-Codecs nach H.264 konvertiert werden.

Standard:

- HEVC / H.265 (`hevc`)
- AV1 (`av1`)
- MPEG-4 (`mpeg4`)

Die Codec-Liste kann über die Plugin-Einstellung angepasst werden.

Beispiele:

```text
hevc,av1,mpeg4
