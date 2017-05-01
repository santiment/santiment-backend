#!/bin/bash -e
#NODE_NAME=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
if [ -z "$NODE_NAME" ]; then
  NODE_NAME=$(hostname)
fi

echo -e "${ssh_keys}" >> /home/ubuntu/.ssh/authorized_keys

# Swap
# sudo umount /dev/xvdb || true
# sudo mkswap /dev/xvdb
# sudo swapon /dev/xvdb
# grep -q '^/dev/xvdb' /etc/fstab && sed -i 's/^\/dev\/xvdb.*/\/dev\/xvdb none swap sw 0 0/' /etc/fstab || echo '/dev/xvdb none swap sw 0 0' >> /etc/fstab

# EBS to ext4
if sudo file -s /dev/xvdf | grep '/dev/xvdf: data' > /dev/null; then
  sudo mkfs -t ext4 /dev/xvdf
  sudo mkdir /srv/elasticsearch
  sudo mount /dev/xvdf /srv/elasticsearch
  grep -q '^/dev/xvdf' /etc/fstab && sed -i 's/^\/dev\/xvdf.*/\/dev\/xvdf \/srv\/elasticsearch ext4 defaults,nofail 0 2/' /etc/fstab || echo '/dev/xvdf /srv/elasticsearch ext4 defaults,nofail 0 2' >> /etc/fstab
fi

# Set file descriptor limit to
cat <<EOF | sudo tee /etc/security/limits.conf
*   hard  nofile 65536
*   soft  nofile 65536
EOF
#sudo sh -c "ulimit -n 65536 && exec su $LOGNAME"

curl -s https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/5.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-5.x.list

sudo add-apt-repository ppa:webupd8team/java
echo "oracle-java8-installer shared/accepted-oracle-license-v1-1 select true" | sudo debconf-set-selections
sudo apt-get update
sudo apt-get install -y oracle-java8-installer oracle-java8-set-default elasticsearch
sudo mkdir -p /srv/elasticsearch/log /srv/elasticsearch/data
sudo chown -R elasticsearch:elasticsearch /srv/elasticsearch/log /srv/elasticsearch/data

cat <<EOF | sudo tee /etc/elasticsearch/elasticsearch.yml
node.name: $NODE_NAME
cluster.name: ${cluster_name}
network.host: _ec2_
path:
  logs: /srv/elasticsearch/log
  data: /srv/elasticsearch/data
discovery:
  type: ec2
  zen.minimum_master_nodes: ${minimum_master_nodes}
  ec2:
    groups: "${security_groups}"
cloud.aws:
  region: "${region}"
EOF

# Must be changed when bootstrap.mlockall: true
sed -ie "s%^#LimitMEMLOCK=infinity$%LimitMEMLOCK=infinity%" /usr/lib/systemd/system/elasticsearch.service
sed -ie "s%^#MAX_LOCKED_MEMORY=unlimited$%MAX_LOCKED_MEMORY=unlimited%" /etc/default/elasticsearch
sudo systemctl daemon-reload

/usr/share/elasticsearch/bin/elasticsearch-plugin install discovery-ec2

sudo service elasticsearch restart
