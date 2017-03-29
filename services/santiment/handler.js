"use strict"

import moment from 'moment'
import Future from 'fluture'
import S from 'sanctuary'

import Validation from 'folktale/data/validation'
const Success = Validation.Success
const Failure = Validation.Failure

import {createSubmittedEvent,
       createGetSentimentResponseItem,
       validAssets,
       validSentiments} from './types'

import DB from './db'
import AWS from 'aws-sdk'

let dynamoDB = new AWS.DynamoDB()

let db = DB(dynamoDB,console)

// Validate the user input and pass the result forward
function validateGetSentiment(event) {
  //Retrieve the userID from the query string. If no user id given, return InvalidInputError
  return ((event.queryStringParameters != null) && (event.queryStringParameters["userId"]))
    ?Success(event.queryStringParameters["userId"])
    :Failure("No userId given in query string")
}

function contains(array,item) {
  return (array.indexOf(item) >=0)
}
function validatePostSentiment(event) {
  let body = null
  try {
    console.log(event)
    if(typeof event.body == 'string') {
      body = JSON.parse(event.body)
    } else {
      body = event.body
    }
  } catch(e) {
    return Failure("Cannot parse body:"+event.body+" ERROR:"+e)
  }

  let validateUserId = (userId) => (userId)?Success(userId):Failure("No userId provided")
  let validateAsset = (asset) => {
    if (asset == null) {
      return Failure("No asset provided")
    }

    return contains(validAssets,asset)
      ?Success(asset)
      :Failure("Invalid Asset provided. Valid options are:"+validAssets)
  }

  let validateSentiment = (sentiment) => {
    if (sentiment == null) {
      return Failure("No sentiment provided")
    }

    return contains(validSentiments,sentiment)
      ?Success(sentiment)
      :Failure("Invalid Sentiment provided. Valid options are:"+validSentiments)
  }

  let validateDate = (date) => {
    if (date == null) {
      return Failure("No date provided")
    }
    return moment(date,moment.ISO_8601,true).isValid()
      ?Success(date)
      :Failure("Date field is not a valid ISO_8601 date")
  }

  return Validation
    .collect([
      validateUserId(body.userId),
      validateAsset(body.asset),
      validateSentiment(body.sentiment),
      validateDate(body.date)])
     .map( _ => body)
}


function postSentiment (event, context, callback) {
  validatePostSentiment(event)
    .fold(Future.reject, Future.of) //Convert Validation to Future
    .map(request=>createSubmittedEvent(request,new Date()))
    .chain(db.logSentimentSubmittedEvent)
    .fold((error)=> {
      console.error(error)
      return {
        statusCode:500,
        body:JSON.stringify(error)
      }
    }, ()=> {
      return {
        statusCode:200,
        body:JSON.stringify({})
      }
    })
    .fork((error)=> {
      //This should never happen
      throw error
    }, (response)=> {
      callback(null,response)
    })
}

function getSentiment (event, context, callback) {
  validateGetSentiment(event)
    .fold(Future.reject,Future.of)
    .chain(db.queryUserSentiment)
    .fold(
      (error)=> {
        console.log(error)
        return {
          statusCode:500,
          body: JSON.stringify(error)
        }
      },
      (value)=> {
        return {
          statusCode: 200,
          body: JSON.stringify(value.map(createGetSentimentResponseItem))
        }
      })
    .fork((error)=> {
      throw error
    }, (response)=> {
      callback(null,response)
    })
}
         
module.exports.getSentiment = getSentiment
module.exports.postSentiment = postSentiment
