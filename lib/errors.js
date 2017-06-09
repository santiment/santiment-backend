"use strict"

const invalidInput = {
  error:"InvalidInputError",
  httpCode:400,
  message:"Invalid input"
}

const server = {
  error:"ServerError",
  httpCode: 500,
  message: "Server error"
}

const makeError = (errorObject)=>(details)=>Object.assign({details:details},errorObject)

exports.InvalidInputError = makeError(invalidInput)
exports.ServerError = makeError(server)

exports.httpStatusCode = (e)=>e.httpCode
exports.httpBody = (e)=>JSON.stringify({
  error:e.error,
  message:e.message,
  details: e.details
})
