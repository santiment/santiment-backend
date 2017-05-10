#!/bin/sh

TROLLBOXIP=$1
if [ -z "$TROLLBOXIP" ]
then
    TROLLBOXIP=`terraform output trollbox_client_ip`
fi

if [ -z "$ELASTICSEARCH_HOST" ]
then
    ELASTICSEARCH_HOST=http://`terraform output elasticsearch_elb_dns`
fi

TARGET=v1.0.0 #Commit that needs to be deployed
echo Provisioning machine ${TROLLBOXIP} with target \'${TARGET}\'

echo Copying config to remote machine
echo Copying to root@${TROLLBOXIP}:/etc/nixos/configuration.nix
# Copy the machine configuration
while sleep 1
do
  scp -rp trollbox_client.nix root@${TROLLBOXIP}:/etc/nixos/configuration.nix && break
done

ssh root@${TROLLBOXIP} 'cat >/etc/nixos/vars.nix' <<EOF
{
  elasticsearchHost = "${ELASTICSEARCH_HOST}";
}
EOF



echo Starting remote config
ssh -A root@${TROLLBOXIP} 'bash -s' <<EOF
nix-channel --update
nixos-rebuild switch
systemctl stop trollbox_client #Stop the client before updating
cd /home/trollbox_client

git clone --depth 1 git@github.com:santiment/trollbox-client.git
cd trollbox-client
git fetch --all
git checkout --force ${TARGET}

yarn install
systemctl start trollbox_client
EOF
