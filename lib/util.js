'use strict'

const Future = require('fluture')
const {InvalidInputError} = require('./errors')
const S = require('./sanctuary')


exports.validationToFuture = (validation)=>validation.matchWith({
  Success: ({value})=>Future.of(value),
  Failure: ({value})=>Future.reject(InvalidInputError(value))
})
