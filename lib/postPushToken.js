'use strict'

const Future = require('fluture')
const Validation = require('folktale/validation')
const {Success, Failure} = Validation
const {validationToFuture} = require('./util')
const R = require('ramda')



function validateRequest(event) {

  let body = null

  try {
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body)
    } else if (typeof event.body === 'object') {
      if (event.body == null) {
	event.body = {}
      }
      body = event.body
    } else {
      return Failure(["Invalid request body:"+event.body])
    }
  } catch(e) {
    return Failure(["Cannot parse event body. Error:"+e])
  }

  const validOSStrings = ["ios", "android"];

  const keys = R.keys(body)

  if (keys.length !== 1)
    return Failure(["Request body must contain a single key"])

  const os = keys[0]

  if ( !R.contains(os, validOSStrings))
    return Failure(["Request key must be one of "+ validOSStrings.toString()])

  const tokenObject = body[os]

  if (typeof tokenObject !== 'object') {
    return Failure([`Value of key ${os} must be an object`])
  }

  const token = tokenObject['token']

  if (token == null)
    return Failure([`Missing property: ${os}.token`])

  if (typeof token !== 'string')
    return Failure([`${os}.token must be a string`])
  
  return Success({os,token})
}

function postPushToken(db) {
  return function (event){
    return validationToFuture(validateRequest(event))
      .chain( (input)=>{
	return db.insertPushTokenIfNotExists(input)
      })
      .map((uuid)=>{
	return {
	  device: {
	    uid: uuid
	  }
	}
      })
  }
}

module.exports = postPushToken
