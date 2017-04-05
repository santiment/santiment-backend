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

export const InvalidInputError = makeError(invalidInput)
export const ServerError = makeError(server)

export const httpStatusCode = (e)=>e.httpCode
export const httpBody = (e)=>JSON.stringify({
  error:e.error,
  message:e.message,
  details: e.details
})
