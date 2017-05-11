provider "aws" {
  region     = "eu-central-1"
  profile = "santiment"
}

# Create a VPC to launch our instances into
resource "aws_vpc" "default" {
  cidr_block = "10.0.0.0/16"
}

# Create an internet gateway to give our subnet access to the outside world
resource "aws_internet_gateway" "default" {
  vpc_id = "${aws_vpc.default.id}"
}

# Grant the VPC internet access on its main route table
resource "aws_route" "internet_access" {
  route_table_id         = "${aws_vpc.default.main_route_table_id}"
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = "${aws_internet_gateway.default.id}"
}

# Create a subnet to launch our instances into
resource "aws_subnet" "default" {
  vpc_id                  = "${aws_vpc.default.id}"
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
}

resource "aws_security_group" "default" {
  name        = "trollbox_client"
  description = "Trollbox client security"
  vpc_id      = "${aws_vpc.default.id}"

  # SSH access from anywhere
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # # HTTP access from the VPC
  # ingress {
  #   from_port   = 80
  #   to_port     = 80
  #   protocol    = "tcp"
  #   cidr_blocks = ["10.0.0.0/16"]
  # }

  # outbound internet access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "es" {
  name = "elasticsearch-node"
  description = "Allows inter-node communication between Elasticsearch nodes"

  vpc_id = "${aws_vpc.default.id}"


  ingress {
    from_port   = 9200
    to_port     = 9200
    protocol    = "tcp"
    self        = true
    cidr_blocks = ["10.0.0.0/16"]
  }

  ingress {
    from_port   = 9300
    to_port     = 9300
    protocol    = "tcp"
    self        = true
    cidr_blocks = ["10.0.0.0/16"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 9200
    to_port     = 9200
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 9300
    to_port     = 9300
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "elb" {
  name = "elasticsearch-lb"
  description = "Allows the load balancer to communicate with Elasticsearch nodes"

  vpc_id = "${aws_vpc.default.id}"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "elb_default" {
  type        = "ingress"
  from_port   = 9200
  to_port     = 9200
  protocol    = "tcp"
  cidr_blocks = ["10.0.0.0/16"]
  security_group_id = "${aws_security_group.elb.id}"
}

resource "aws_security_group_rule" "elb_http" {
  type        = "ingress"
  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["10.0.0.0/16"]
  security_group_id = "${aws_security_group.elb.id}"
}

resource "aws_security_group_rule" "elb_https" {
  type        = "ingress"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["10.0.0.0/16"]
  security_group_id = "${aws_security_group.elb.id}"
}

resource "aws_security_group_rule" "elb_es" {
  type        = "egress"
  from_port   = 9200
  to_port     = 9200
  protocol    = "tcp"
  source_security_group_id = "${aws_security_group.es.id}"
  security_group_id = "${aws_security_group.elb.id}"
}

resource "aws_key_pair" "trollbox_client" {
  key_name   = "trollbox_client_key"
  public_key = "${file(var.public_key_path)}"
}

resource "aws_instance" "trollbox_client" {
  #NixOS 17.03 EBS instance (eu-central-1)
  ami           = "ami-5450803b"
  instance_type = "t2.micro"
  key_name = "${aws_key_pair.trollbox_client.id}"

  # Our Security group to allow HTTP and SSH access
  vpc_security_group_ids = ["${aws_security_group.default.id}"]

  # We're going to launch into the same subnet as our ELB. In a production
  # environment it's more common to have a separate private subnet for
  # backend instances.
  subnet_id = "${aws_subnet.default.id}"

  # The connection used for provisioning
  # provisioner "local-exec" {
  #   command = "./trollbox_client_provision.sh ${aws_instance.trollbox_client.public_ip}"
  # }
}

resource "aws_iam_policy" "es" {
  name = "ElasticsearchAccess"
  description = "Allows listing EC2 instances. Used by elasticsearch for cluster discovery"
  policy = <<POLICY
{
  "Statement": [
    {
      "Action": [
        "ec2:DescribeInstances"
      ],
      "Effect": "Allow",
      "Resource": [
        "*"
      ]
    }
  ],
  "Version": "2012-10-17"
}
POLICY
}

resource "aws_iam_policy_attachment" "es" {
  name = "ElasticsearchAttachment"
  roles = ["${aws_iam_role.es.name}"]
  policy_arn = "${aws_iam_policy.es.arn}"
}

resource "aws_iam_role" "es" {
  name = "ElasticsearchNode"
  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
POLICY

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_instance_profile" "es" {
  name = "ElasticsearchNode"
  roles = ["${aws_iam_role.es.name}"]

  lifecycle {
    create_before_destroy = true
  }
}

data "template_file" "elastic_search_server" {
  template = "${file("elastic_search_server.sh")}"

  vars {
    ssh_keys = "${aws_key_pair.trollbox_client.public_key}"
    elasticsearch_version = "5.3.2"
    cluster_name= "santiment-elasticsearch-cluster"
    number_of_replicas = 1
    minimum_master_nodes = 2
    security_groups = "${aws_security_group.es.id}"
    region = "eu-central-1"
  }
}

resource "aws_instance" "elastic_search_server" {
  count = 3
  #Ubuntu Server 16.04 LTS (HVM), SSD Volume Type
  ami           = "ami-060cde69"
  instance_type = "m4.large"
  key_name = "${aws_key_pair.trollbox_client.id}"

  # Our Security group to allow HTTP and SSH access
  vpc_security_group_ids = ["${aws_security_group.es.id}"]

  # Only connect from inside the vpc
  #associate_public_ip_address = false

  # IAM instance needed for elasticsearch node discovery
  iam_instance_profile = "${aws_iam_instance_profile.es.id}"

  # We're going to launch into the same subnet as our ELB. In a production
  # environment it's more common to have a separate private subnet for
  # backend instances.
  subnet_id = "${aws_subnet.default.id}"


  root_block_device {
    volume_type           = "gp2"
    volume_size           = "${var.volume_size_root}"
    delete_on_termination = true
  }

  ebs_block_device {
    device_name           = "/dev/sdf"
    volume_type           = "gp2"
    volume_size           = "${var.volume_size_data}"
    delete_on_termination = false
  }

  # ephemeral_block_device {
  #   device_name  = "/dev/sdb"
  #   virtual_name = "ephemeral0"
  # }

  tags {
    Role = "elasticsearch"
    Name = "elasticsearch-${count.index}"
  }

  #associate_public_ip_address = false

  lifecycle {
    create_before_destroy = true
  }

  # Provisioning
  user_data = "${data.template_file.elastic_search_server.rendered}"

}

resource "aws_elb" "es" {
  connection_draining = true
  cross_zone_load_balancing = true

  name = "elasticsearch-elb"
  subnets = ["${aws_subnet.default.id}"]
  internal = true

  security_groups = ["${aws_security_group.elb.id}"]
  instances = ["${aws_instance.elastic_search_server.*.id}"]

  listener {
    instance_port     = 9200
    instance_protocol = "http"
    lb_port           = 80
    lb_protocol       = "http"
  }

  listener {
    instance_port     = 9200
    instance_protocol = "http"
    lb_port           = 9200
    lb_protocol       = "http"
  }

  health_check {
    target              = "HTTP:9200/_cluster/health"
    healthy_threshold   = 10
    unhealthy_threshold = 10
    interval            = 300
    timeout             = 60
  }
}


output "trollbox_client_ip" {
  value = "${aws_instance.trollbox_client.public_ip}"
}

output "elastic_private_ip" {
  value = ["${aws_instance.elastic_search_server.*.private_ip}"]
}

output "elasticsearch_elb_dns" {
  value = "${aws_elb.es.dns_name}"
}

output "default_security_group_id" {
  value = "${aws_security_group.default.id}"
}

output "default_subnet_id" {
  value = "${aws_subnet.default.id}"
}
