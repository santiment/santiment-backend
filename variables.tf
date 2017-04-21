variable "public_key_path" {
  description = <<DESCRIPTION
Path to the SSH public key to be used for authentication.
Example: ~/.ssh/terraform.pub
DESCRIPTION
  default = "terraform_rsa.pub"
}

variable "private_key_path" {
  description = <<DESCRIPTION
Path to the SSH private key to be used for provisioning.

Example: ~/.ssh/terraform
DESCRIPTION
  default = "terraform_rsa"
}
