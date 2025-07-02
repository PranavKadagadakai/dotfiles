# Change Dirs
alias ..="z .."
alias cd..="z .."
alias ...="z ../../"
alias ....="z ../../../"

# More ls aliases
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
alias update="sudo -- sh -c 'apt-get update; apt-get upgrade -y; apt-get dist-upgrade -y; apt-get autoremove -y; apt-get autoclean -y;'"
alias cl="clear"
alias vi="vim"

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
