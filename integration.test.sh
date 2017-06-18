#!/usr/bin/env bash

set -e

echo "Integration test"

URL=`terraform output base_url`

curl -X POST $URL/sentiment -d @- -H 'Content-type: application/json' <<EOF
{
  "asset": "BTC_USD",
  "price": 11666,
  "sentiment": "bullish",
  "date": "2017-04-12T22:00:00.000Z",
  "userId": "INTEGRATION_TEST_USER"
}
EOF

curl -X GET "$URL/sentiment?userId=INTEGRATION_TEST_USER"
curl -X GET "$URL/sentiment/aggregate?asset=BTC_USD&from=2017-01-01&to=2017-12-31"
curl -X GET "$URL/feed?source=btce&keyword=eth"
