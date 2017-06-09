'use strict'
1
import getAggregateSentiment from './getAggregateSentiment'
import Future from 'fluture'

test ("getAggregateSentiment - single date", (done)=>{
  const db = {
    getSentimentPerAsset: (asset,from,to)=>{
      expect(asset).toEqual("ETH_USD")
      expect(from).toEqual("2017-05-01")
      expect(to).toEqual('2017-05-01T23:59:59.999Z')
      return Future.of({"2017-05-01":{
        bullish:0,
        bearish:0,
        catish:0
      }})
    }
  }
  getAggregateSentiment(db)({queryStringParameters:{
    asset:"ETH_USD",
    date:"2017-05-01"
  }}).fork((error)=>{
    console.log(error)
    throw error
  }, (value)=>{
    expect(value).toEqual({
      bullish:0,
      bearish:0,
      catish:0
    })
    done()
  })
  
})

test ("getAggregateSentiment - date range", (done)=>{
  const db = {
    getSentimentPerAsset: (asset,from,to)=>{
      expect(asset).toEqual("ETH_USD")
      expect(from).toEqual("2017-05-01")
      expect(to).toEqual('2017-05-03')
      return Future.of({
        "2017-05-01":{
          bullish:0,
          bearish:0,
          catish:0
        },
        "2017-05-02":{
          bullish:2,
          bearish:3,
          catish:4
        }
      })
    }
  }
  
  getAggregateSentiment(db)({queryStringParameters:{
    asset:"ETH_USD",
    from:"2017-05-01",
    to:"2017-05-03"
  }}).fork((error)=>{
    console.log(error)
    throw error
  }, (value)=>{
    expect(value).toContainEqual({
      date:"2017-05-01",
      bullish:0,
      bearish:0,
      catish:0
    })
    expect(value).toContainEqual({
      date:"2017-05-02",
      bullish:2,
      bearish:3,
      catish:4
    })
    done()
  })
  
})

let testInvalidInput = (event)=>{
  return test("getAggregateSentiment -- invalid input", (done)=>{
    const db = {
      getSentimentPerAsset: _=>{throw arguments}
    }
    getAggregateSentiment(db)(event).fork(
      (error)=> {
        console.log(error)
        expect(error).toMatchObject({
          error:"InvalidInputError"
        })
        done()
      },
      (value)=> {
        throw value;
      }
    )
  })
}
              
testInvalidInput()
testInvalidInput(null)
testInvalidInput({queryStringParameters:null})
testInvalidInput({queryStringParameters:{}})
testInvalidInput({queryStringParameters:{
  date:null,
}})
testInvalidInput({queryStringParameters:{
  from:"2017-01-01T00:00:00Z",
}})

