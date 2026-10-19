# Speak Emirati — Complete Audio Production Report

Source: 60-lesson `lesson-data.json` from the Speak Emirati preview. No legacy recordings are reused.

## Confirmed inventory

- 10 units, 60 lessons.
- 761 multiple-choice exercises, 674 tile-building exercises, 192 Listen & Build exercises.
- 429 vocabulary entries.
- **1,031 distinct Arabic speech texts** after whitespace normalization: **529 single-token words**, **502 multiword phrases/sentences**.
- **11 reusable UI sound effects**.
- **1,042 audio files** total.
- **5,258 placements** of Arabic speech across vocabulary, answers, and options. The placement CSV maps each to one recording.

## Arabic audio by source

| Source | Occurrences | Unique texts within source |
|---|---:|---:|
| Vocabulary | 429 | 294 |
| Completed tile answers and Listen & Build answers | 866 | 466 |
| Individual tile options (including distractors) | 3,813 | 495 |
| Arabic multiple-choice answers | 30 | 25 |
| All Arabic multiple-choice options (including answers and distractors) | 120 | 74 |

The categories overlap. Do not sum the per-category unique-text counts: the deduplicated combined total is **1,031**. The category occurrences sum to **5,258**.

## Voice allocation

- **516** recordings assigned young Emirati male voice ID `kce2Lrd9QaRFFmnnvhlS`.
- **515** recordings assigned young Emirati female voice ID `6rbNSV8qvjiwBtVjUjCk`.
- Assignment alternates across a stable, sorted list of distinct texts. This is a provisional balanced allocation, not yet a review of grammatical gender, speaker identity, or naturalness.
- Each unique text is generated once; its recording is reused wherever it appears.

## UI effects (11)

1. `tap` — answer selection.
2. `tile-select` — tile added.
3. `tile-remove` — tile removed.
4. `correct` — correct answer.
5. `incorrect` — wrong answer.
6. `exercise-complete` — exercise finished.
7. `lesson-complete` — lesson finished.
8. `xp-reward` — XP awarded.
9. `lesson-unlock` — lesson unlocked.
10. `unit-unlock` — unit unlocked.
11. `streak` — streak milestone.

## Exported files

- `speak_emirati_audio_production_manifest.csv`: **1,031 rows**, one for each Arabic speech file, with text, assigned voice, ElevenLabs ID, destination filename, categories, lessons, and generation/review status.
- `speak_emirati_audio_usage_map.csv`: **5,258 rows**, mapping each vocabulary entry, exercise answer, and Arabic option to its audio file.
- `speak_emirati_sound_effects_manifest.csv`: **11 rows**, one for each sound effect.
- `speak_emirati_audio_final_report.json`: machine-readable counts.

## Important production notes

- **Nothing has been generated yet.** Every speech row is marked `pending_generation` and `pending_linguistic_review`.
- The deduplication rule collapses whitespace only. It intentionally preserves differences in spelling and diacritics; reviewing text variants could reduce the number of recordings or identify genuinely distinct pronunciations.
- A single-word entry is defined here as a string with no spaces; Arabic attached particles may be part of the same token. This is not a linguistic word segmentation.
- The audit covers the Arabic text in the structured vocabulary, answers, and options. Arabic embedded only inside English prompts/explanations is not separately counted unless it also appears in those structured fields.
- Before generating, check Arabic wording and grammatical gender, and decide whether some short expressions should use a specific speaker or require multiple gender-specific recordings.
- Sound effects should be short, consistent, and lower in loudness than speech. Keep speech and SFX volume/mute controls separate.
