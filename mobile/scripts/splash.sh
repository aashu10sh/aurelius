#!/usr/bin/env bash
# iOS launch screens (public/splash/), one per iPhone screen size: the app icon
# centred on the app background. iOS shows these only for an exact size match;
# index.html links each with its media query. Rerun after changing icon.svg.
# Needs ImageMagick. Sizes: CSS width x height @ pixel ratio.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/splash
for size in 440x956@3 430x932@3 428x926@3 420x912@3 414x896@3 414x896@2 414x736@3 402x874@3 393x852@3 390x844@3 375x812@3 375x667@2 320x568@2; do
  css=${size%@*} ratio=${size#*@}
  w=$(( ${css%x*} * ratio )) h=$(( ${css#*x} * ratio ))
  icon=$(( 96 * ratio ))
  magick -size "${w}x${h}" xc:'#110e0b' \
    \( -background none -density 300 public/icon.svg -resize "${icon}x${icon}" \) \
    -gravity center -composite -strip -define png:compression-level=9 "PNG8:public/splash/${w}x${h}.png"
done
