#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

open_terminal() {
  local title=$1
  local command=$2
  local dir=$3
  
  if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="$title" -- bash -c "cd '$SCRIPT_DIR/$dir' && $command; exec bash"
  elif command -v xterm &> /dev/null; then
    xterm -T "$title" -e bash -c "cd '$SCRIPT_DIR/$dir' && $command; exec bash" &
  elif command -v konsole &> /dev/null; then
    konsole --title "$title" -e bash -c "cd '$SCRIPT_DIR/$dir' && $command; exec bash" &
  elif command -v x-terminal-emulator &> /dev/null; then
    x-terminal-emulator -e bash -c "cd '$SCRIPT_DIR/$dir' && $command; exec bash" &
  else
    (cd "$SCRIPT_DIR/$dir" && $command) &
  fi
}

open_terminal "Dev Frontend" "echo 'Starting Frontend...'; npm run dev" "dev-front"
sleep 0.5
open_terminal "Dev Backend" "echo 'Starting Backend...'; uv run main.py" "dev-back"

echo "Started frontend and backend in separate terminal windows"

