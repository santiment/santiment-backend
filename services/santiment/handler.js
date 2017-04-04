"use strict"

import DB from './db'
import AWS from 'aws-sdk'

let dynamoDB = new AWS.DynamoDB()
let db = DB(dynamoDB,console)

import getSentiment from './getSentiment'
import postSentiment from './postSentiment'
import {createLambda} from './lambda'

         
module.exports.getSentiment = createLambda(getSentiment(db))
module.exports.postSentiment = createLambda(postSentiment(db))
