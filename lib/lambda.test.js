import Future from 'fluture'
import {createLambda} from './lambda'
import {ServerError,httpBody, httpStatusCode} from './errors'

test("createLambda: successful response", (done)=>{
  const lambda = createLambda( (event)=>{
    expect(event).toEqual("event")
    return Future.of("result")
  })

  lambda("event","context",(err,val)=>{
    expect(err).toBe(null)
    expect(val).toEqual({
      statusCode:200,
      body:JSON.stringify("result")
    })
    done()
  })
})

test("createLambda: error response", (done)=>{
  const testerr = ServerError("error")
  const lambda = createLambda( (event)=>{
    expect(event).toEqual("event")
    return Future.reject(testerr)
  })

  lambda("event","context",(err,val)=>{
    expect(val).toEqual({
      statusCode: httpStatusCode(testerr),
      body: httpBody(testerr)
    })
    expect(err).toBe(null)
    done()
  })
})
