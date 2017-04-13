'use strict'
import Future from 'fluture'
import S from './sanctuary'
import moment from 'moment'



// DB::(DynamoDB,Logger)=>Module
export default function DB(dynamoDB,logger) {
  const sentimentLogTable = "sentimentLogTable"
  const sentimentAssetIndex = "SentimentByAssetIndex"
  const errorLogger = (error) => {
    logger.error("DB Error:", error)
    return error
  }

  const trace = (label)=>(value)=>{
    logger.info(label,JSON.stringify(value))
    return value
  }

  function transformSentimentLogQueryItem(x){
    //TODO how to handle invalid items?
    try {
      return S.Just({
        userId:x.userId.S,
        receivedTimestamp: new Date(x.receivedTimestamp.S),
        submittedTimestamp: new Date(x.submittedTimestamp.S),
        asset: x.asset.S,
        sentiment: x.sentiment.S
      })
    }
    catch (e) {
      logger.error("transformItem:",e)
      return S.Nothing
    }
  }

  function queryMapReduce (params,mapTransform,reduceTransform){
    trace("queryMapReduce:")(params)
    return Future.node(done=>dynamoDB.query(params,done))
      .chain(S.pipe([
        trace("query result:"),
        S.get(_=>true, "Items"),
        S.map(S.map(mapTransform)),
        S.chain(S.sequence(S.Maybe)),
        S.map(reduceTransform),
        trace("map-reduce result:"),
        S.reduce_((err,val)=>Future.of(val),
                  Future.reject("Wrong DB response"))
      ]))
  }

  return {
    // logSentimentSubmittedEvent::SentimentSubmittedEvent=>Future<void>
    logSentimentSubmittedEvent(event) {
      let params = {
        Item: {
          userId: {
            S: event.userId
          },
          receivedTimestamp: {
            S: event.receivedTimestamp.toISOString()
          },
          submittedTimestamp: {
            S: event.submittedTimestamp.toISOString()
          },
          asset: {
            S: event.asset
          },
          sentiment: {
            S: event.sentiment
          }
        },
        TableName:sentimentLogTable
      }
      return Future.node( (done)=>dynamoDB.putItem(params,done))
        .mapRej(errorLogger)
    },

    //queryUserSentiment:: UserId=>Future<Array<SentimentSubmittedEvent>>
    queryUserSentiment (userId) {
      let params = {
        TableName: sentimentLogTable,
        ConsistentRead: false,
        ExpressionAttributeValues: {
          ":userId" : {
            S: userId
          }
        },
        KeyConditionExpression: "userId = :userId",
        ScanIndexForward: false
      }

      return queryMapReduce(params,transformSentimentLogQueryItem,S.I)
    },

    getSentimentPerAsset(asset,from, to){
      let params = {
        IndexName: sentimentAssetIndex,
        TableName: sentimentLogTable,
        ConsistentRead: false,
        ExpressionAttributeValues: {
          ":asset" : {
            S: asset
          },
          ":from": {
            S: from
          },
          ":to": {
            S: to
          }
        },
        KeyConditionExpression: "asset = :asset and submittedTimestamp between :from and :to"
      }

      let aggregateItem = (current)=>(item)=>{
        const date = moment(item.submittedTimestamp)
        const date_str = date.format("YYYY-MM-DD")
        if(current[date_str] == null){
          current[date_str] = {
            bullish:0,
            bearish:0,
            catish:0
          }
        }
        current[date_str][item.sentiment]+=1
        return current
      }
      
      let aggregateSentiment = S.reduce(aggregateItem,{})

      return queryMapReduce(params,transformSentimentLogQueryItem, aggregateSentiment)
    }
  }
}
