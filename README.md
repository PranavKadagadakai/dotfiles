# My dotfiles

This directory contains the dotfiles for my system

## Requirements

Ensure you have the following installed on your system

### Git

```
sudo apt install git
```

### Stow

```
sudo apt install stow
```

## Installation

First, check out the dotfiles repo in your $HOME directory using git

```
cd $HOME
git clone https://github.com/PranavKadagadakai/dotfiles.git 
```

then use GNU stow to create symlinks

```
cd ~/dotfiles
stow alacritty git ghostty bash hyprland hyprlock hyprmocha hyprpaper i3 kitty nvim ohmyposh picom polybar redshift rofi screenlayout starship syncthing tmux vim waybar wofi xresources yazi zellij zsh
```
