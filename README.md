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


