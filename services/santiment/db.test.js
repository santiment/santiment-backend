import DB from './db'

test("jest is workig", ()=>{})

let user = "TESTUSER",
    ts1 = (new Date(Date.now())),
    ts2 = (new Date(Date.now()-100000)),
    asset = "BTC",
    sentiment = "bullish"


test("logSentimentSubmittedEvent", done=>{

  let mockIface = {
    putItem: (params,done) => {
      expect(params).toEqual({
        Item: {
          userId: {
            S: user
          },
          receivedTimestamp: {
            S: ts1.toISOString()
          },
          submittedTimestamp: {
            S: ts2.toISOString()
          },
          asset: {
            S: asset
          },
          sentiment: {
            S: sentiment
          }
        },
        TableName:"sentimentLogTable"
      })
      done(null, {})
    }
  }
  
  let db = DB(mockIface, console)

  db.logSentimentSubmittedEvent({
    userId:"TESTUSER",
    receivedTimestamp: ts1,
    submittedTimestamp: ts2,
    asset:"BTC",
    sentiment:"bullish"
  })
    .fork((err)=>{throw err}, (value)=>{
      expect(value).toEqual({})
      done()
    })
});


test("queryUserSentiment empty query", (done)=>{
  let mockIface = {
    query: (params,done)=>{
      expect(params).toEqual( {
        TableName: "sentimentLogTable",
        ConsistentRead: false,
        ExpressionAttributeValues: {
          ":userId": {
            S: user
          }
        },
        KeyConditionExpression: "userId = :userId",
        ScanIndexForward: false
      })
      
      return done(null, {Items:[]})
    }
  }

  let db = DB(mockIface, console)
  db.queryUserSentiment(user).fork( (err)=>{throw err}, (value)=>{
    expect(value).toEqual([])
    done()
  });
});

test("queryUserSentiment 1 item query", (done)=>{
  let mockIface = {
    query: (params,done)=>{
      expect(params).toEqual( {
        TableName: "sentimentLogTable",
        ConsistentRead: false,
        ExpressionAttributeValues: {
          ":userId": {
            S: user
          }
        },
        KeyConditionExpression: "userId = :userId",
        ScanIndexForward: false
      })
      
      return done(null, {Items:[
        {
          userId: {S: user},
          receivedTimestamp: {S: ts1.toISOString()},
          submittedTimestamp: {S: ts2.toISOString()},
          asset: {S: asset},
          sentiment: {S: sentiment}
        }
      ]})
    }
  }

  let db = DB(mockIface, console)
  db.queryUserSentiment(user).fork( (err)=>{throw err}, (value)=>{
    expect(value).toEqual([{
      userId: user,
      receivedTimestamp: ts1,
      submittedTimestamp: ts2,
      asset: asset,
      sentiment: sentiment
    }])
    done()
  });
});


test("queryUserSentiment wrong query result", (done)=>{
  let mockIface = {
    query: (params,done)=>{
      expect(params).toEqual( {
        TableName: "sentimentLogTable",
        ConsistentRead: false,
        ExpressionAttributeValues: {
          ":userId": {
            S: user
          }
        },
        KeyConditionExpression: "userId = :userId",
        ScanIndexForward: false
      })
      
      return done(null, {Items:[{}]})
    }
  }

  let db = DB(mockIface, console)
  db.queryUserSentiment(user).fork( (err)=>{
    done()
  }, (value)=>{
      throw value
  });
});

test("getSentimentPerAsset", (done)=>{
  let mockIface = {
    query: (params,done)=>{
      expect(params).toEqual({
        TableName: "sentimentLogTable",
        IndexName: "SentimentByAssetIndex",
        ConsistentRead: false,
        ExpressionAttributeValues: {
          ":asset" : {
            S: "ETC_USD"
          },
          ":from": {
            S: "2017-05-01"
          },
          ":to": {
            S: "2017-05-03"
          }
        },
        KeyConditionExpression: "asset = :asset and submittedTimestamp between :from and :to"
      })
      return done(null,{Items:[
        {
          userId: {S: user},
          receivedTimestamp: {S: "2017-05-01T11:11:11Z"},
          submittedTimestamp: {S: "2017-05-01T11:11:11Z"},
          asset: {S: "ETC_USD"},
          sentiment: {S: "bullish"}
        },
        {
          userId: {S: user},
          receivedTimestamp: {S: "2017-05-01T11:11:11Z"},
          submittedTimestamp: {S: "2017-05-01T12:11:11Z"},
          asset: {S: "ETC_USD"},
          sentiment: {S: "bullish"}
        },
        {
          userId: {S: user},
          receivedTimestamp: {S: "2017-05-01T11:11:11Z"},
          submittedTimestamp: {S: "2017-05-01T11:12:11Z"},
          asset: {S: "ETC_USD"},
          sentiment: {S: "bearish"}
        },
        {
          userId: {S: user},
          receivedTimestamp: {S: "2017-05-02T11:11:11Z"},
          submittedTimestamp: {S: "2017-05-02T11:11:11Z"},
          asset: {S: "ETC_USD"},
          sentiment: {S: "bullish"}
        }]})
    }
  }
  let db = DB(mockIface, console)
  
  db.getSentimentPerAsset("ETC_USD","2017-05-01","2017-05-03").fork((err)=>{throw err}, (value)=>{
    expect(value).toEqual({
      "2017-05-01":{
        bullish:2,
        bearish:1,
        catish:0
      },
      "2017-05-02":{
        bullish:1,
        catish:0,
        bearish:0
      }})
    done()
  })
});

test("Hang error case", (done)=>{
  const problemQuery = {
    "Items": [
    { "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T16:29:18.911Z" }
    }, {
      "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T16:40:44.048Z" }
    }, {
      "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T19:57:26.192Z" }
    }, {
      "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T16:41:35.495Z" }
    }, {
      "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T16:36:29.126Z" }
    }, {
      "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T16:30:36.848Z" }
    }, {
      "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T16:30:12.228Z" }
    }, {
      "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T16:29:36.069Z" }
    }, {
      "submittedTimestamp": { "S": "2017-04-01T00:00:00.000Z" },
      "sentiment": { "S": "bullish" },
      "userId": { "S": "TESTUSER" },
      "asset": { "S": "TESTASSET" },
      "receivedTimestamp": { "S": "2017-04-05T17:06:59.446Z" }
    } ],
    "Count": 9, "ScannedCount": 9
  }

  let mockIface = {
    query: (params,done)=>{
      expect(params).toEqual({
        TableName: "sentimentLogTable",
        IndexName: "SentimentByAssetIndex",
        ConsistentRead: false,
        ExpressionAttributeValues: {
          ":asset" : {
            S: "TESTASSET"
          },
          ":from": {
            S: "2017-01-01"
          },
          ":to": {
            S: "2017-05-01"
          }
        },
        KeyConditionExpression: "asset = :asset and submittedTimestamp between :from and :to"
      })
      return done(null,problemQuery)
    }
  }
  let db = DB(mockIface, console)
  
  db.getSentimentPerAsset("TESTASSET","2017-01-01","2017-05-01").fork((err)=>{throw err}, (value)=>{
    expect(value).toEqual({
      "2017-04-01":{
        bullish:9,
        bearish:0,
        catish:0
      }})
    done()
  })
});
  
    
