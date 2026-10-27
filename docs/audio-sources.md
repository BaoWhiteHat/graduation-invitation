# Hacking scene audio edit

## Background music

“Crypto” by Kevin MacLeod (incompetech.com), ISRC USUAN1600013.
Source and attribution: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600013
License: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/.
Composer describes it as dark, eerie, unnerving and suspenseful, 80 BPM.
Downloaded from the composer's player: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Crypto.mp3.
Local `public/audio/crypto-bed.mp3` is an edited 00:08–00:56 extract, normalized to -20 LUFS and encoded as stereo 128 kbps MP3, with a 1.2-second fade-in. Attribution and the license link appear on `public/credits.html`, reached through the information icon beside the expanded audio control. The arrival page contains no music-credit line.
The music has its own continuous voice and gain envelope. Existing typing and notification effects remain separate; pausing between terminal lines stops typing SFX while the background music continues.

## Sound effects

Replaces the original oscillator score with cuts from the two references supplied by the user.

| Local sample | Reference | Source section |
| --- | --- | --- |
| `public/audio/hacking-burst.wav` | https://www.youtube.com/shorts/LtkTMlO7iPA | 00:00.2–00:09.6 |
| `public/audio/binary-data.wav` | https://www.youtube.com/watch?v=Y8w-2lzM-C4 | 00:04–00:10 |
| `public/audio/binary-alert.wav` | Same Binary Code reference | 00:32–00:38 |
| `public/audio/binary-release.wav` | Same Binary Code reference | 01:04–01:10 |

Sources were captured from the actual video playback, excluding advertisements, then converted to mono PCM WAV at 24 kHz for browser decoding compatibility. These are reference extracts, not original recordings or a newly licensed sound library. Binary Code is a Sound Response sample-pack demonstration: https://www.soundresponse.net/interface-sound-effects/.

`src/audio-cues.js` defines individual sub-cuts. Typing uses the visual terminal's exact start and end times, including silence between rows and during the 99% stall. Popup sounds use the popup timestamps. The red intrusion, security arrival and threat removal use separate cuts. Each cut has 5 ms edge fades; completed one-shots never retrigger until the timeline is reset. Mute, replay, skip and hidden-page handling stop active voices.
