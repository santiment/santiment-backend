"use strict"

import {merge} from 'ramda'

const defaultConfig = {
  ELASTICSEARCH_API_VERSION:"5.3",
  ELASTICSEARCH_PORT:"9200",
  ELASTICSEARCH_HOST:null, //Needs to be provided from environment
  DYNAMODB_PREFIX:null
}
const config = merge(defaultConfig, process.env)

if(config.DYNAMODB_PREFIX == null) {
  console.error("WARN: No DynamoDB database prefix specified")
}

import AWS from 'aws-sdk'

import DB from './lib/db'
let dynamoDB = new AWS.DynamoDB()
let db = DB(config.DYNAMODB_PREFIX, dynamoDB, console)

import ESFactory from './lib/elasticsearch'
import elasticsearch from 'elasticsearch'

const esUrl = config.ELASTICSEARCH_HOST + ":" + config.ELASTICSEARCH_PORT

const esIface = ESFactory({
  elasticsearch,
  host:esUrl,
  apiVersion: config.ELASTICSEARCH_API_VERSION,
  logger:console
})



import getSentiment from './lib/getSentiment'
import postSentiment from './lib/postSentiment'
import getAggregateSentiment from './lib/getAggregateSentiment'
import getFeed from './lib/getFeed'
import {createLambda} from './lib/lambda'


module.exports.getSentiment = createLambda(getSentiment(db))
module.exports.postSentiment = createLambda(postSentiment(db))
module.exports.getSentimentAggregate = createLambda(getAggregateSentiment(db))
module.exports.getFeed = createLambda(getFeed(esIface))
