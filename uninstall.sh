#!/bin/bash

if ! [ $0 == "./uninstall.sh" ]; then
  echo "Error: please run this command from Transmi's root directory ($0)" >&2
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "We need su permission to uninstall Transmi"
  sudo echo "Good to go!"
fi

sudo docker rm -f transmission

sudo systemctl stop transmi
sudo rm -f /etc/systemd/system/transmi.service

sudo rm -f /etc/nginx/sites-enabled/transmi.conf
sudo rm -f /etc/nginx/sites-available/transmi.conf

if [ -f "./.downloads-path" ]; then
  read -p "Remove downloads? [y/N]: " remove_downloads
  if [ $remove_downloads == "y" ] || [ $remove_downloads == "Y" ]; then
    downloads_path=`cat ./.downloads-path`
    rm -rf $downloads_path
  fi
else
  echo "Warning: Transmi does not appear to have been installed with the install script. You will need to remove downloads manualy"
fi
