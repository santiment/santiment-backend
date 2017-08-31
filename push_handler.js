"use strict"

import {merge} from 'ramda'

const defaultConfig = {
  PG_URL:null
}
const config = merge(defaultConfig, process.env)

if(config.PG_URL == null) {
  console.error("WARN: No Postgres connection given")
}

import AWS from 'aws-sdk'

const PG = require('./lib/pg')

//This will keep the connection and use it for more than one
//invocation

if (global.pg != null) {
  global.pg = PG(config.PG_URL)
}

import postPushToken from './lib/postPushToken'

import {createLambda} from './lib/lambda'

module.exports.postPushToken = createLambda(postPushToken(global.pg))
