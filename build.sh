#!/usr/bin/env bash

set -e

if [ -z "$ENV" ]; then
    ENV=stage
fi

echo "Building lambda.zip"

src=`pwd`
tmp=$src/.tmp
out=$src/.tmp/lambda.zip
echo "SRC: $src" "TMP: $tmp" "OUT: $out"


mkdir -p $tmp
rm -rf $tmp/*

webpack --output-path $tmp --output-filename handler.js

cp $src/package.json $tmp
cp $src/yarn.lock $tmp
cd $tmp

yarn install --production
echo `pwd`
zip -r9 $out "."
#rm -rf $tmp

aws s3 cp $out s3://santiment-private/lambda/${ENV}/lambda.zip

aws lambda update-function-code --function-name ${ENV}-getSentiment\
    --s3-bucket santiment-private\
    --s3-key lambda/${ENV}/lambda.zip

aws lambda update-function-code --function-name ${ENV}-postSentiment\
    --s3-bucket santiment-private\
    --s3-key lambda/${ENV}/lambda.zip

aws lambda update-function-code --function-name ${ENV}-getSentimentAggregate\
    --s3-bucket santiment-private\
    --s3-key lambda/${ENV}/lambda.zip

aws lambda update-function-code --function-name ${ENV}-getFeed\
    --s3-bucket santiment-private\
    --s3-key lambda/${ENV}/lambda.zip
