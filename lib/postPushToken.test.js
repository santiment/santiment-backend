const postPushToken = require('./postPushToken')
import Future from 'fluture'

const wrongInputTest = (input)=>{
  test("postPushToken wrong input", (done)=>{
    const db = {
      insertPushTokenIfNotExists: ()=>{
	throw new Error(arguments)
      }
    }
    
    postPushToken(db)(input)
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
wrongInputTest({body:null})
wrongInputTest({body:{}})
wrongInputTest({body:{abc:{uid:"asdf"}}})
wrongInputTest({body:{ios:{},android:{}}})

test("Correct operation", (done)=>{
  const db = {
    insertPushTokenIfNotExists: ({os,token})=>{
      expect(os).toEqual('ios')
      expect(token).toEqual('testtoken')

      return Future.of("testuuid")
    }
  }

  postPushToken(db)({
    body:{
      ios:{
	token:'testtoken'
      }
    }
  })
    .fork ( (error)=>
	    {
	      throw error
	    },
	    
	    (value)=>
	    {
	      expect(value).toMatchObject({
		device:{
		  uid:'testuuid'
		}
	      })
	      done()
	    }
	  )
  
})
