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

output "trollbox_client_ip" {
  value = "${aws_instance.trollbox_client.public_ip}"
}
