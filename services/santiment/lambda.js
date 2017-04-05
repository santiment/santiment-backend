"use strict"
/* lambda.js - AWS Lambda interface. */
import {httpBody as errorBody, httpStatusCode as errorStatusCode} from './errors'

export function createLambda(handler) {
  return (event,context,callback) => {
    handler(event)
      .fold((error)=>({
        statusCode: errorStatusCode(error),
        body: errorBody(error)
      }), (value)=>({
        statusCode: 200,
        body: JSON.stringify(value)
      }))
      .fork( (error)=>{throw error}, (value)=> callback(null,value))
  }
}




