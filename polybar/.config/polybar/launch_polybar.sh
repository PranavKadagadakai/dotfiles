#!/bin/bash

CONFIG_PATH="$HOME/.config/polybar/config.ini"

if type "xrandr"; then
  for m in $(xrandr --query | grep " connected" | cut -d" " -f1); do
    MONITOR=$m polybar --config=$CONFIG_PATH --reload toph >> /tmp/polybar.log 2>&1 &
  done
else
  polybar --config=$CONFIG_PATH --reload toph >> /tmp/polybar.log 2>&1 &
fi

