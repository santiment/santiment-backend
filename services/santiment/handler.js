"use strict"

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Go Serverless v1.0! Your function executed successfully!",
      input: event,
    }),
  }

  callback(null, response)

  // Use this code if you don"t use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: "Go Serverless v1.0! Your function executed successfully!", event })
}

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
  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({})
  })
}
