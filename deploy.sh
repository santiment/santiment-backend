#!/bin/sh

pushd services/santiment
npm install
serverless deploy
popd
