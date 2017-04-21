#!/bin/sh

TROLLBOXIP=$1
if [ -z "$TROLLBOXIP" ]
then
      TROLLBOXIP=`terraform output trollbox_client_ip`
fi

TARGET=master #Commit that needs to be deployed
echo Provisioning machine ${TROLLBOXIP} with target \'${TARGET}\'

echo Copying config to remote machine
echo Copying to root@${TROLLBOXIP}:/etc/nixos/configuration.nix
# Copy the machine configuration
while sleep 1
do
  scp -rp trollbox_client.nix root@${TROLLBOXIP}:/etc/nixos/configuration.nix && break
done


echo Starting remote config
ssh -A root@${TROLLBOXIP} 'bash -s' <<EOF
nix-channel --update
nixos-rebuild switch
systemctl stop trollbox_client #Stop the client before updating
cd /home/trollbox_client

git clone --depth 1 git@github.com:santiment/santiment.git
cd santiment
git fetch --all
git checkout --force ${TARGET}

cd trollbox_backend
yarn install
systemctl start trollbox_client
EOF
