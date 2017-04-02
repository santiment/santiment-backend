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
