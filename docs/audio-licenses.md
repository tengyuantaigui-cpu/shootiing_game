# BGMライセンス・取得記録

確認・取得日：2026-10-11。全4候補の配布ページにCC0表記を確認し、掲載されたループ音源を取得しました。CC0は商用利用、改変・変換、再配布を許可します。[CC0説明と法的文書](https://creativecommons.org/publicdomain/zero/1.0/)。作者によるSTAR CREDITの推奨を意味しません。

|用途・配布ファイル|音源・作者|配布元|ライセンス|
|---|---|---|---|
|タイトル / title.m4a|Brute Force — vitalezzz（表記：Vitalezzz）|[配布ページ](https://opengameart.org/content/brute-force)|CC0 1.0|
|通常戦闘 / battle.m4a|8-bit Epic Space Shooter Music — HydroGene|[配布ページ](https://opengameart.org/content/8-bit-epic-space-shooter-music)|CC0 1.0|
|ボス / boss.m4a|Fast fight / battle music (looped) — Ville Nousiainen、ループ編集 XCVG|[配布ページ](https://opengameart.org/content/fast-fight-battle-music-looped)|CC0 1.0|
|エンドレス後半 / endless.m4a|Interstellar Fleet 1 — Zane Little Music|[配布ページ](https://opengameart.org/content/interstellar-fleet-1)|CC0 1.0|

配布元はいずれもOpenGameArt.org。作者クレジットは任意ですが上記を表示します。Fast Fightの作者リンク：[Ville Nousiainen](https://soundcloud.com/mutkanto)、編集者：[XCVG](https://xcvgsystems.com)。Brute Forceの配布ページの表記は「Vitalezzz - Brute Force」です。

## 取得物と変換

- [8bit-spaceshooter.mp3](https://opengameart.org/sites/default/files/8bit-spaceshooter.mp3)：配布ページ表示2MB。ループ対応の説明あり。
- [interstellar_fleet_1.zip](https://opengameart.org/sites/default/files/interstellar_fleet_1.zip)：配布ページ表示66.2MB。WAV/Interstellar Fleet 1 [LOOP].wavを採用。
- [fight_looped.wav](https://opengameart.org/sites/default/files/fight_looped.wav)：配布ページ表示4.4MB。作者原曲をXCVGがループ編集した版。
- [brute_force_loop.wav](https://opengameart.org/sites/default/files/brute_force_loop.wav)：配布ページ表示39.3MB。非ループ版・重複MP3は不採用。

macOSのafconvertでステレオ、44.1kHz、AACへ変換。タイトル64kbps、通常・エンドレス80kbps、ボス96kbps、quality 127。曲の切り出しや別音源への置換はしていません。元WAV/MP3/ZIPは一時領域に保存し、公開対象srcには圧縮したM4Aだけを配置しています。取得サイズ・変換後サイズは[BGM実装報告](bgm-report.md)に記録しています。

既存SEとフォールバックBGM・結果ジングルはSTAR CREDITの既存Web Audio合成であり、第三者録音ファイルを使用しません。

ループ版を選定していますが、圧縮後の継ぎ目の聴感、タイトル曲の落ち着き、長時間聴取時の疲労感は実聴による最終確認が必要です。作者のループ表記やデコード成功だけで聴感確認済みとは扱いません。
