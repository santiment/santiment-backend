"use strict"

import {merge} from 'ramda'

const defaultConfig = {
  ELASTICSEARCH_API_VERSION:"5.3",
  ELASTICSEARCH_PORT:"9200",
  ELASTICSEARCH_HOST:null //Needs to be provided from environment
}
const config = merge(defaultConfig, process.env)


import AWS from 'aws-sdk'

import DB from './db'
let dynamoDB = new AWS.DynamoDB()
let db = DB(dynamoDB,console)

import ESFactory from './elasticsearch'
import elasticsearch from 'elasticsearch'

const esUrl = config.ELASTICSEARCH_HOST + ":" + config.ELASTICSEARCH_PORT

const esIface = ESFactory({
  elasticsearch,
  host:esUrl,
  apiVersion: config.ELASTICSEARCH_API_VERSION,
  logger:console
})



import getSentiment from './getSentiment'
import postSentiment from './postSentiment'
import getAggregateSentiment from './getAggregateSentiment'
import getFeed from './getFeed'
import {createLambda} from './lambda'


module.exports.getSentiment = createLambda(getSentiment(db))
module.exports.postSentiment = createLambda(postSentiment(db))
module.exports.getAggregateSentiment = createLambda(getAggregateSentiment(db))
module.exports.getFeed = createLambda(getFeed(esIface))
