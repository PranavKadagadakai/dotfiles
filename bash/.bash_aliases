# Change Dirs
alias ..="cd .."
alias cd..="cd .."
alias ...="cd ../../"
alias ....="cd ../../../"

# More ls aliases
alias lA="ls -Al"
alias lt="ls -ltr" # sort by time/date
alias labc="ls -lAp" # sort alphabetically

# Safe copying/moving
alias cp="cp -vi"
alias mv="mv -vi"

# Copy with Verbose(Progress bar)
alias cpv='rsync -avh --info=progress2'

# Some more handfull aliases
alias bashrc="nano ~/.bashrc"
alias update="sudo -- sh -c 'apt-get update; apt-get upgrade -y; apt-get dist-upgrade -y; apt-get autoremove -y; apt-get autoclean -y;'"
alias cl="clear"
alias vi="vim"
