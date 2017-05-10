#!/bin/sh

# Script that sets up the elasticsearch trollbox index. it depends on
# two environment variables: ES_HOST and ES_PORT. By default
# ES_HOST=http://localhost and ES_PORT=9200.



if [ -z "$ES_HOST" ]; then
    ES_HOST="http://localhost"
fi

if [ -z "$ES_PORT" ]; then
    ES_PORT="9200"
fi

ES_ADDRESS="${ES_HOST}:${ES_PORT}"

echo "Creating datafeed index for Elasticsearch cluster at address ${ES_ADDRESS}..."

curl -XPUT "${ES_ADDRESS}/datafeed" -d @- -H 'Content-Type: application/json' <<EOF
{
  "settings": {
    "index": {
      "number_of_shards": 6,
      "number_of_replicas": 1
    }
  },
  "mappings": {
    "trollbox_message": {
      "properties": {
        "receivedTimestamp": { "type" : "date" },
        "trollboxCounter": { "type" : "long" },
        "trollboxUsername": { "type" : "keyword" },
        "trollboxReputation": { "type" : "integer" },
        "message": { "type" : "text" }
      }
    }
  }
}
EOF
