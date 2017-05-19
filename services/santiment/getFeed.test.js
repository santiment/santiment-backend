import getFeed from './getFeed'
import Future from 'fluture'

test("getFeed empty result", (done)=>{
  const esIface = {
    trollboxFeed: (keyword,size)=>{
      expect(keyword).toEqual("btc")
      return Future.of([])
    }
  }
  getFeed(esIface)({
    queryStringParameters: {
      keyword:"btc",
      source:"trollbox"
    }
  }).fork( (error)=>{console.log(error); throw error}, (value)=>{
    expect(value).toEqual([])
    done()
  })
})

test("getFeed non-empty result", (done)=>{
  const esIface = {
    trollboxFeed: (kw,s)=>{
      expect(kw).toEqual('btc')
      return Future.of([{
        receivedTimestamp: 0,
        message:"hello btc",
        username:"user",
        counter:1,
        reputation:0
      }])
    }
  }

  getFeed(esIface)({
    queryStringParameters: {
      keyword:"btc",
      source:"trollbox"
    }
  }).fork( (error)=>{console.log(error); throw error}, (value)=>{
    expect(value).toEqual([{
      timestamp:0,
      message:"hello btc",
      source:"trollbox",
      username:"user"
    }])
    done()
  })
})

const wrongInputTest = (input)=>{
  test("getFeed wrong input", (done)=>{
    getFeed({trollboxFeed:()=>{throw new Error()}})(input)
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
