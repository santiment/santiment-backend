
import * as errors from './errors'

test("Invalid input error", ()=>{
  const err = errors.InvalidInputError(123)
  const code = errors.httpStatusCode(err)
  expect(code).toBe(400)
  const http = JSON.parse(errors.httpBody(err))
  expect(http).toEqual({
    error:"InvalidInputError",
    message:"Invalid input",
    details:123
  })
})
