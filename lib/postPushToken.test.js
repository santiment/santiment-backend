import postPushToken from './postPushToken'
import Future from 'fluture'

const wrongInputTest = (input)=>{
  test("postPushToken wrong input", (done)=>{
    postPushToken(input)
      .fork( (error)=> {
        expect(error).toMatchObject({
          error:"InvalidInputError"
        })
        done()
      }, (value)=>{throw value})
  })
}

wrongInputTest()
wrongInputTest(null)
wrongInputTest({queryStringParameters:null})
wrongInputTest({queryStringParameters:{keyword:"_DF%#$"}})
