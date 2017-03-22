#!/bin/sh

pushd services/santiment
npm install
serverless webpack serve
popd
