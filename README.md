# santiment-backend

Installation instructions
=========================

Serverless
----------

```sh
cd santiment-backend
npm install
npm run serverless -- config credentials --profile santiment --provider aws --key APIKEY --secret APISECRET
npm run deploy
```

Terraform
---------

Terraform is used to orchestrate the trollbox client EC2 instance

1. Install terraform
2. Run `$terraform apply`

The instance is set up with ssh access. To access it you will need the
private key, which is located in Google
Drive/Website/terraform_rsa. Download the file and then run

```sh
ssh -i terraform_rsa root@INSTANCE_IP_ADDRESS
```

Local Test
----------

```sh
npm start
```
This will start a server at localhost:8000 which will serve all defined Lambda functions.
