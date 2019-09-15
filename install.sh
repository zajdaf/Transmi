#!/bin/bash

if ! [ $0 == "./install.sh" ]; then
  echo "Error: please run this command from Transmi's root directory ($0)" >&2
  exit 1
fi

if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed' >&2
  exit 1
fi

if ! [ -x "$(command -v node)" ]; then
  echo 'Error: node is not installed (https://github.com/nvm-sh/nvm)' >&2
  echo 'If you are lazy, run the following commands:'
  echo ''
  echo 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash'
  echo 'export NVM_DIR="$HOME/.nvm"'
  echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
  echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"'
  echo 'nvm install 10.16.3'
  echo ''

  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "We need su permission to setup Transmi"
  sudo echo "Good to go!"
fi

if [ "$1" != "--skip-certificates" ]; then
    sudo apt-get update
    sudo apt-get install software-properties-common -y
    sudo add-apt-repository universe -y
    sudo add-apt-repository ppa:certbot/certbot -y
    sudo apt-get update
    sudo apt-get install nginx certbot python-certbot-nginx -y
fi

## Transmission init
read -p "Select a path where downloads will land [/home/downloads]: " downloads_path
downloads_path=${downloads_path:-/home/downloads}
echo -n $downloads_path > ./.downloads-path

cd transmission
docker build -t transmission .
mkdir -p $downloads_path/files
chmod 777 $downloads_path

docker run -d -p 127.0.0.1:9091:9091 -p 51414:51414 -p 51414:51414/udp -v $downloads_path:/transmission/downloads --name transmission transmission

## Create service
cd ..
service_file="[Unit]\n\
Description=Transmi\n\
\n\
[Service]\n\
ExecStart=$(command -v node) $(pwd)/src/app.js\n\
Restart=always\n\
RestartSec=10\n\
StandardOutput=syslog\n\
StandardError=syslog\n\
Environment=NODE_ENV=production\n\
WorkingDirectory=$(pwd)\n\
\n\
[Install]\n\
WantedBy=multi-user.target"

cd src
npm install
npm run build-web
read -p "Choose a username to access Transmi [$USERNAME]: " transmi_username
transmi_username=${transmi_username:-$USERNAME}

read -s -p "Choose a password to access Transmi with $transmi_username [toto4242]: " password
password=${password:-toto4242}

password=`echo -n $password | sha1sum | sed 's/  -//'`

echo '{"'$transmi_username'":{"password":"'$password'"}}' > db-data.json

cd ..

sudo echo -e $service_file > /etc/systemd/system/transmi.service
sudo systemctl start transmi


## nginx & certificates 

if [ -x "$(command -v nginx)" ]; then
  read -p "Enter the host you want transmi to be available at [torrent.$HOSTNAME.com]: " transmi_host
  transmi_host=${transmi_host:-torrent.$HOSTNAME.com}
  
  nginx_file="server {\n\
\tlisten 443 ssl;\n\
\tlisten [::]:443 ssl;\n\
\n\
\tserver_name $transmi_host;\n\
\n\
\n\
\tlocation / {\n\
\t\tproxy_set_header X-SSL-CERT \$ssl_client_escaped_cert;\n\
\t\tproxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n\
\t\tproxy_set_header Host \$http_host;\n\
\t\tproxy_set_header X-Forwarded-Proto https;\n\
\t\tproxy_pass http://127.0.0.1:7897;\n\
\t}\n\
\n\
\tlocation /download {\n\
\t\talias $downloads_path;\n\
\t}\n\
}"

  sudo echo -e $nginx_file > /etc/nginx/sites-available/transmi.conf
  sudo ln -s /etc/nginx/sites-available/transmi.conf /etc/nginx/sites-enabled/transmi.conf

  sudo systemctl reload nginx

  ## Certificates
  if [ "$1" != "--skip-certificates" ]; then
    sudo certbot --nginx -d $transmi_host
    echo -e 'The install went fine, thank you for choosing Transmi!\nThe service is running at this url https://'$transmi_host
  else
    echo 'You still need to handle SSL certificates by yourself or edit /etc/nginx/sites-available/transmi.conf to change the listening port to 80'
  fi
else
  echo -e 'The install went fine, thank you for choosing Transmi!\nThe service is running at this url http://127.0.0.1:7897'
fi
