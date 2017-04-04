
import getSentiment from './getSentiment'
import Future from 'fluture'

let user = 'user',
    receivedTs = new Date(),
    submittedTs = new Date(Date.now()-100000),
    asset = 'BTC',
    sentiment = 'bullish'


test("getSentiment empty result", (done)=>{
  const db = {
    queryUserSentiment: (userId)=>{
      expect(userId).toEqual('user')
      return Future.of([])
    }
  }
  getSentiment(db)({
    queryStringParameters: {
      userId: 'user'
    }
  }).fork((error)=>{throw error}, (value)=>{
    expect(value).toEqual([])
    done()
  })
})

test("getSentiment non-empty result", (done)=>{
  const db = {
    queryUserSentiment: (userId)=>{
      expect(userId).toEqual('user')
      return Future.of([{
        userId:user,
        receivedTimestamp: receivedTs,
        submittedTimestamp: submittedTs,
        asset: asset,
        sentiment: sentiment
      }])
    }
  }
  
  getSentiment(db)({
    queryStringParameters: {
      userId: 'user'
    }
  }).fork((error)=>{throw error}, (value)=>{
    expect(value).toEqual([{
      id: user+'/'+receivedTs.toISOString(),
      date: submittedTs.toISOString(),
      asset: asset,
      sentiment: sentiment
    }
    ])
    done()
  })
})


const wrongInputTest = (input)=>{
  test("getSentiment wrong input", (done)=>{
    getSentiment({queryUserSentiment:()=>{throw new Error()}})(input)
      .fork( (error)=> {done()}, (value)=>{throw value})
  })
}

wrongInputTest()
wrongInputTest(null)
wrongInputTest(1)
wrongInputTest({})
wrongInputTest({queryStringParameters:null})
wrongInputTest({queryStringParameters:{}})


