variable "env" {
  default = "stage"
}

provider "aws" {
  region     = "eu-central-1"
  profile = "santiment"
}

data "terraform_remote_state" "lambda_stage" {
  backend = "s3"
  config {
    bucket = "santiment-private"
    key = "terraform/stage/lambda/terraform.tfstate"
    region = "eu-central-1"
    profile = "santiment"
  }
}

data "terraform_remote_state" "lambda_production" {
  backend = "s3"
  config {
    bucket = "santiment-private"
    key = "terraform/production/lambda/terraform.tfstate"
    region = "eu-central-1"
    profile = "santiment"
  }
}

output "stage_base_url" {
  value = "${data.terraform_remote_state.lambda_stage.base_url}"
}

output "production_base_url" {
  value = "${data.terraform_remote_state.lambda_production.base_url}"
}
