# santiment-backend

Installation instructions
------------------------

```sh
cd santiment-backend
npm install
npm run serverless -- config credentials --profile santiment --provider aws --key APIKEY --secret APISECRET
npm run deploy
```

Local Test
----------

```sh
npm start
```
This will start a server at localhost:8000 which will serve all defined Lambda functions.

GET - https://uc9998ho97.execute-api.eu-central-1.amazonaws.com/dev/sentiment
POST - https://uc9998ho97.execute-api.eu-central-1.amazonaws.com/dev/sentiment



