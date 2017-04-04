"use strict"
/* lambda.js - AWS Lambda interface. */


let getErrorStatusCode = () => 500
let getErrorBody = (error)=>JSON.stringify(error)

export function createLambda(handler) {
  return (event,context,callback) => {
    handler(event)
      .fold((error)=>({
        statusCode: getErrorStatusCode(error),
        body: getErrorBody(error)
      }), (value)=>({
        statusCode: 200,
        body: JSON.stringify(value)
      }))
      .fork( (error)=>{throw error}, (value)=> callback(null,value))
  }
}




