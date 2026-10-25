#!/usr/bin/env python3
"""Copy the rulebook data into the Unreal project so the game reads the same rules as the tabletop.

Run from anywhere:  python game/PatchGame/Tools/sync_rules.py
"""
import json
import pathlib
import shutil

PROJECT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = PROJECT.parents[1] / "rulebook" / "data" / "rules.json"
TARGET = PROJECT / "Content" / "Data" / "rules.json"

data = json.loads(SOURCE.read_text(encoding="utf-8"))
for key in ("constants", "derived", "bestiary", "gear", "spectacle"):
    if key not in data:
        raise SystemExit(f"rules.json is missing '{key}', which the game needs")

TARGET.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(SOURCE, TARGET)
print(f"Synced {SOURCE} -> {TARGET} ({len(data['bestiary'])} bestiary entries, {len(data['gear'])} gear)")
