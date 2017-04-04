import Future from 'fluture'
import {createLambda} from './lambda'

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
  const lambda = createLambda( (event)=>{
    expect(event).toEqual("event")
    return Future.reject("error")
  })

  lambda("event","context",(err,val)=>{
    expect(val).toEqual({
      statusCode:500,
      body: JSON.stringify("error")
    })
    expect(err).toBe(null)
    done()
  })
})
