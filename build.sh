#!/usr/bin/env bash

set -e

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

aws s3 cp $out s3://santiment-private/lambda/stage/lambda.zip

aws lambda update-function-code --function-name stage-getSentiment\
    --s3-bucket santiment-private\
    --s3-key lambda/stage/lambda.zip

aws lambda update-function-code --function-name stage-postSentiment\
    --s3-bucket santiment-private\
    --s3-key lambda/stage/lambda.zip

aws lambda update-function-code --function-name stage-getSentimentAggregate\
    --s3-bucket santiment-private\
    --s3-key lambda/stage/lambda.zip
