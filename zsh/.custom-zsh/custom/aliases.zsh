# Change Dirs
alias cd="z"
alias ..="z .."
alias cd..="z .."
alias ...="z ../../"
alias ....="z ../../../"

# More ls aliases
alias ls="eza"
alias la="eza -la -a"
alias ll="eza -l"
alias lT="eza -lT" # long tree list
alias lt="eza -lr -s=date" # sort by date/time
alias labc="ls -lAp" # sort alphabetically

# Safe copying/moving
alias cp="cp -vi"
alias mv="mv -vi"

# Copy with Verbose(Progress bar)
alias cpv='rsync -avh --info=progress2'

# Some more handfull aliases
alias bashrc="nvim ~/.bashrc"
alias zshrc="nvim ~/.zshrc"
alias cl="clear"
alias vi="vim"
alias src="source"
alias srczsh="source ~/.zshrc"
alias srcpyvenv="source ./.venv/bin/activate"

# Backup installed packages and apps
alias backup-packages="bash ~/.scripts/backup-packages.sh"

# Fabric aliases
# Loop through all files in the ~/.config/fabric/patterns directory
for pattern_file in $HOME/.config/fabric/patterns/*; do
    # Get the base name of the file (i.e., remove the directory path)
    pattern_name=$(basename "$pattern_file")

    # Create an alias in the form: alias pattern_name="fabric --pattern pattern_name"
    alias_command="alias $pattern_name='fabric -s --pattern $pattern_name'"

    # Evaluate the alias command to add it to the current shell
    eval "$alias_command"
done

yt() {
    if [ "$#" -eq 0 ] || [ "$#" -gt 2 ]; then
        echo "Usage: yt [-t | --timestamps] youtube-link"
        echo "Use the '-t' flag to get the transcript with timestamps."
        return 1
    fi

    transcript_flag="--transcript"
    if [ "$1" = "-t" ] || [ "$1" = "--timestamps" ]; then
        transcript_flag="--transcript-with-timestamps"
        shift
    fi
    local video_link="$1"
    fabric -y "$video_link" $transcript_flag
}

# Terminal clipboard commands
alias pbcopy="xsel --input --clipboard"
alias pbpaste="xsel --output --clipboard"

# Unset update alias (if it exists) before defining the function
unalias update 2>/dev/null

# System update function 
update() {
  echo "=== APT packages ==="
  sudo apt-get update
  sudo apt-get upgrade -y
  sudo apt-get dist-upgrade -y
  sudo apt-get autoremove -y
  sudo apt-get autoclean -y

  if command -v flatpak >/dev/null 2>&1; then
    echo "=== Flatpak apps ==="
    flatpak update -y
    flatpak uninstall --unused -y
  fi

  if command -v brew >/dev/null 2>&1; then
    echo "=== Homebrew formulae ==="
    brew update
    brew upgrade
    brew cleanup
  fi
}

# Full clear with scrollback buffer deletion
fcl() {
  clear && printf '\e[3J'
}

# ==========================================
# Local AI Agent Server Configuration
# ==========================================

# Direct shortcut to launch the Qwen 7B Agent server
alias run-agent-server="llama-server -m ~/ai-models/qwen2.5-coder-7b-instruct-q4_k_m.gguf -ngl 99 -c 32768 -np 3 --flash-attn on --jinja --port 8000"

# Flexible function to launch any local GGUF model as an Agent endpoint
# Usage: serve-agent ~/path/to/model.gguf [optional_port]
serve-agent() {
    local model_path=$1
    local port=${2:-8000} # Defaults to port 8000 if not provided

    if [ -z "$model_path" ]; then
        echo "❌ Error: Please specify a path to a GGUF model."
        echo "Usage: serve-agent ~/ai-models/model.gguf"
        return 1
    fi

    echo "🚀 Starting OpenAI-compatible Agent Server..."
    echo "📦 Model: $model_path"
    echo "🌐 Port: $port"
    echo "🧠 Context Window: 32,768 tokens (Agent Optimized)"
    echo "⚡ Hardware: Offloading layers to RTX 5060 + Flash Attention"
    print -P "%F{yellow}--------------------------------------------------%f"

    llama-server \
        -m "$model_path" \
        --port "$port" \
        -ngl 99 \
        -c 32768 \
        -np 3 \
        --flash-attn on \
        --jinja
}
