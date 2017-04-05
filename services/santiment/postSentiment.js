'use strict'
/* @flow */

import moment from 'moment'
import Future from 'fluture'
import S from './sanctuary'

import Validation from 'folktale/data/validation'
const Success = Validation.Success
const Failure = Validation.Failure

import {validSentiments} from './types'
import {InvalidInputError} from './errors'

import type {SubmitSentimentRequest, SentimentSubmittedEvent} from './types'

function contains(array,item) {
  return (array.indexOf(item) >=0)
}

function validatePostSentiment(event) {
  let body = null
  try {
    if(typeof event.body === 'string') {
      body = JSON.parse(event.body)
    } else if(typeof event.body === 'object') {
      if (event.body == null) {
        event.body = {}
      }
      body = event.body
    } else {
      return Failure(["Invalid request body:"+event.body])
    }
  } catch(e) {
    return Failure(["Cannot parse event body. ERROR:"+e])
  }

  let validateUserId = (userId) => (userId)?Success(userId):Failure(["No userId provided"])
  let validateAsset = (asset) => {
    if (asset == null) {
      return Failure(["No asset provided"])
    }

    return Success(asset)
  }

  let validateSentiment = (sentiment) => {
    if (sentiment == null) {
      return Failure(["No sentiment provided"])
    }

    return contains(validSentiments,sentiment)
      ?Success(sentiment)
      :Failure(["Invalid Sentiment provided. Valid options are:"+((validSentiments:any):string)])
  }

  let validateDate = (date) => {
    if (date == null) {
      return Failure(["No date provided"])
    }
    return moment(date,moment.ISO_8601,true).isValid()
      ?Success(date)
      :Failure(["Date field is not a valid ISO_8601 date"])
  }

  return Validation
    .collect([
      validateUserId(body.userId),
      validateAsset(body.asset),
      validateSentiment(body.sentiment),
      validateDate(body.date)])
     .map( _ => body)
}

export function createSubmittedEvent(request: SubmitSentimentRequest, receivedTimestamp: Date): SentimentSubmittedEvent {
  const submitted = new Date(Date.parse(request.date))
  
  return {
    userId: request.userId,
    asset: request.asset,
    receivedTimestamp: receivedTimestamp,
    submittedTimestamp: submitted,
    sentiment: request.sentiment
  }
}

export default function postSentiment(db:any){
  return (event:any)=>{
    return validatePostSentiment(event)
      .fold(S.pipe([InvalidInputError,Future.reject]), Future.of) //Convert Validation to Future
      .map(request=>createSubmittedEvent(request,new Date()))
      .chain(db.logSentimentSubmittedEvent)
      .map( _=>({}))
  }
}
