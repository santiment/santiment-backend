variable "env" {
  default = "stage"
}

provider "aws" {
  region     = "eu-central-1"
  profile = "santiment"
}

data "terraform_remote_state" "lambda" {
  backend = "s3"
  config {
    bucket = "santiment-private"
    key = "terraform/${var.env}/lambda/terraform.tfstate"
    region = "eu-central-1"
    profile = "santiment"
  }
}

output "sentiment_url" {
  value = "${data.terraform_remote_state.lambda.sentiment_path}"
}
