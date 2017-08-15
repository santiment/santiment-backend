'use strict'

const Future = require('fluture')
const Validation = require('folktale/data/validation')
const {Success, Failure} = Validation
const {validationToFuture} = require('./util')

module.exports = (event)=> {
    return validationToFuture(validateRequest(event))
}


function validateRequest(event) {
  return Failure(["Not implemented"]);
}
