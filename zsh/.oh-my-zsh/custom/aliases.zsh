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
alias bashrc="nano ~/.bashrc"
alias zshrc="nano ~/.zshrc"
alias update="sudo -- sh -c 'apt-get update; apt-get upgrade -y; apt-get dist-upgrade -y; apt-get autoremove -y; apt-get autoclean -y;'"
alias cl="clear"
alias vi="vim"
