"use strict"
let AWS = require('aws-sdk')
let dynamoDB = new AWS.DynamoDB()

module.exports.getSentiment = (event, context, callback) => {
  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      userId: "TESTUSER",
      sentiment: [
        {
          id:"aaa",
          asset:"BTC",
          sentiment:"bullish",
          date: "2017-03-16T23:23:41.229Z"
        },
        {
          id:"bbb",
          asset:"BTC",
          sentiment:"bullish",
          date: "2017-03-17T23:23:41.229Z"
        },
        {
          id:"aAA",
          asset:"ETH",
          sentiment:"bearish",
          date: "2017-03-14T23:23:41.229Z"
        },
        {
          id:"EEE",
          asset:"ETH",
          sentiment:"bearish",
          date: "2017-03-15T23:23:41.229Z"
        },
        {
          id:"GGG",
          asset:"ETH",
          sentiment:"bearish",
          date: "2017-03-16T23:23:41.229Z"
        },
        {
          id:"ZZZ",
          asset:"ETH",
          sentiment:"bearish",
          date: "2017-03-17T23:23:41.229Z"
          
        }
      ]
    })
  })
}

module.exports.postSentiment = (event, context, callback) => {
  let params = {
    Item: {
      userId: {
        S:"abcde"
      },
      receivedTimestamp: {
        N:Date.now().toString()
      },
      submittedTimestamp: {
        S:Date.now().toString()
      },
      currency: {
        S:"BTC"
      },
      sentiment: {
        S:"bullish"
      }
    },
    ReturnConsumedCapacity:"TOTAL",
    TableName:"sentimentLogTable"
  }
  dynamoDB.putItem(params, (err,data)=>{
    if(err) {
      return callback(null, {
        statusCode: 500,
        body: JSON.stringify(err)
      })
    } else {
      return callback(null, {
        statusCode:200,
        body: JSON.stringify(data)
      })
    }
  })
}

