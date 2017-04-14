"use strict"
/* @flow */

import S from './sanctuary'

import Validation from 'folktale/data/validation'
import Future from 'fluture'
const Success = Validation.Success
const Failure = Validation.Failure

//import Future from 'fluture'

import type {SentimentSubmittedEvent,GetSentimentResponseItem} from './types'
import * as err from './errors'

function createGetSentimentResponseItem(event: SentimentSubmittedEvent): GetSentimentResponseItem {
  return {
    id: event.userId+"/"+event.receivedTimestamp.toISOString(),
    date: event.submittedTimestamp.toISOString(),
    asset: event.asset,
    sentiment: event.sentiment,
    price: S.maybeToNullable(event.price)
  }
}


// Validate the user input and pass the result forward
function validateGetSentiment(event) {
  try {
    if (event.queryStringParameters.userId != null){
      return Success(event.queryStringParameters.userId)
    }
  }
  catch (e) {}
  return Failure(["Parameter 'userId' missing from query string"])
}


export default function getSentiment (db:any){
  return (event:any)=> {
    return validateGetSentiment(event)
      .fold(S.pipe([err.InvalidInputError, Future.reject]),
            Future.of)
      .chain(db.queryUserSentiment)
      .map(S.map(createGetSentimentResponseItem))
  }
}
