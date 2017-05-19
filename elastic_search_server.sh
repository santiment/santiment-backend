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

cat <<EOF | sudo tee /etc/elasticsearch/jvm.options
## JVM configuration

################################################################
## IMPORTANT: JVM heap size
################################################################
##
## You should always set the min and max JVM heap
## size to the same value. For example, to set
## the heap to 4 GB, set:
##
## -Xms4g
## -Xmx4g
##
## See https://www.elastic.co/guide/en/elasticsearch/reference/current/heap-size.html
## for more information
##
################################################################

# Xms represents the initial size of total heap space
# Xmx represents the maximum size of total heap space

-Xms1g
-Xmx1g

################################################################
## Expert settings
################################################################
##
## All settings below this section are considered
## expert settings. Don't tamper with them unless
## you understand what you are doing
##
################################################################

## GC configuration
-XX:+UseConcMarkSweepGC
-XX:CMSInitiatingOccupancyFraction=75
-XX:+UseCMSInitiatingOccupancyOnly

## optimizations

# disable calls to System#gc
-XX:+DisableExplicitGC

# pre-touch memory pages used by the JVM during initialization
-XX:+AlwaysPreTouch

## basic

# force the server VM (remove on 32-bit client JVMs)
-server

# explicitly set the stack size (reduce to 320k on 32-bit client JVMs)
-Xss1m

# set to headless, just in case
-Djava.awt.headless=true

# ensure UTF-8 encoding by default (e.g. filenames)
-Dfile.encoding=UTF-8

# use our provided JNA always versus the system one
-Djna.nosys=true

# use old-style file permissions on JDK9
-Djdk.io.permissionsUseCanonicalPath=true

# flags to configure Netty
-Dio.netty.noUnsafe=true
-Dio.netty.noKeySetOptimization=true
-Dio.netty.recycler.maxCapacityPerThread=0

# log4j 2
-Dlog4j.shutdownHookEnabled=false
-Dlog4j2.disable.jmx=true
-Dlog4j.skipJansi=true

## heap dumps

# generate a heap dump when an allocation from the Java heap fails
# heap dumps are created in the working directory of the JVM
-XX:+HeapDumpOnOutOfMemoryError

# specify an alternative path for heap dumps
# ensure the directory exists and has sufficient space
#-XX:HeapDumpPath=\$\{heap.dump.path}

## GC logging

#-XX:+PrintGCDetails
#-XX:+PrintGCTimeStamps
#-XX:+PrintGCDateStamps
#-XX:+PrintClassHistogram
#-XX:+PrintTenuringDistribution
#-XX:+PrintGCApplicationStoppedTime

# log GC status to a file with time stamps
# ensure the directory exists
#-Xloggc:\$\{loggc}

# By default, the GC log file will not rotate.
# By uncommenting the lines below, the GC log file
# will be rotated every 128MB at most 32 times.
#-XX:+UseGCLogFileRotation
#-XX:NumberOfGCLogFiles=32
#-XX:GCLogFileSize=128M

# Elasticsearch 5.0.0 will throw an exception on unquoted field names in JSON.
# If documents were already indexed with unquoted fields in a previous version
# of Elasticsearch, some operations may throw errors.
#
# WARNING: This option will be removed in Elasticsearch 6.0.0 and is provided
# only for migration purposes.
#-Delasticsearch.json.allow_unquoted_field_names=true
EOF

# Must be changed when bootstrap.mlockall: true
sed -ie "s%^#LimitMEMLOCK=infinity$%LimitMEMLOCK=infinity%" /usr/lib/systemd/system/elasticsearch.service

sed -ie "s%^#MAX_LOCKED_MEMORY=unlimited$%MAX_LOCKED_MEMORY=unlimited%" /etc/default/elasticsearch
sudo systemctl daemon-reload

/usr/share/elasticsearch/bin/elasticsearch-plugin install discovery-ec2

sudo service elasticsearch restart
