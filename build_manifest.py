#!/usr/bin/env python3
import os
import json
import hashlib
import time
import argparse


def MD5_hash(filepath):
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def MD5_hash_all(dirpath):
    filelist = []
    for dirpath, _, filenames in os.walk(dirpath):
        for filename in filenames:
            path = os.path.join(dirpath, filename)
            filelist.append({"hash": MD5_hash(path), "path": path})
    return filelist


def build_manifest(dirs):
    filelist = [f for d in dirs for f in MD5_hash_all(d)]
    return {"timestamp": time.time(), "files": filelist}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="build manifest.json")
    parser.add_argument("paths", nargs="+")
    args = parser.parse_args()
    manifest = build_manifest(args.paths)
    print(json.dumps(manifest, indent=2))
