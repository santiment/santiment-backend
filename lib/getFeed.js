'use strict'

const Future = require('fluture')
const Validation = require('folktale/validation')
const {Success, Failure} = Validation
const {validationToFuture} = require('./util')

module.exports = (esIface) => {
  return (event)=> {
    return validationToFuture(validateRequest(event))
      .chain((token)=>esIface.btceFeed(token,20))
      .map( (result)=>
            result.map( (item)=>({
              btceTime: item.btceTime,
              id: item.counter,
              timestamp: Math.floor(item.receivedTimestamp/1000),
              username: item.username,
              message: item.message,
              source: "btce"
            })))

  }
}

function validateRequest(event) {
  if (event == null)
    return Failure(["No event given"])

  let params = event.queryStringParameters

  if (params == null)
    return Failure(["No query string given"])

  let validateKeyword = (keyword)=>{
    if (keyword == null) {
      return Failure(["No 'keyword' given"])
    }

    if (/^[a-z0-9]+$/i.exec(keyword) == null) {
      return Failure(["Parameter 'keyword' must be a string containing only alphanumeric characters"])
    }

    return Success(keyword)
  }



  return validateKeyword(params.keyword)
}
