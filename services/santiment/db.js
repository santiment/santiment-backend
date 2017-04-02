'use strict'
import Future from 'fluture'
import {create} from 'sanctuary'
const S = create({checkTypes:false, env:[]})


// DB::(DynamoDB,Logger)=>Module
export default function DB(dynamoDB,logger) {
  const sentimentLogTable = "sentimentLogTable"
  const errorLogger = (error) => {
    logger.error("DB Error:", error)
    return error
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

      let transformItem = (x)=> {
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
      
      return Future.node((done)=>dynamoDB.query(params,done))
      //Extract and values and transform them to an array of SentimentSubmittedEvent objects
        .chain( S.pipe([
          S.get(_=>true, "Items"),
          S.map(S.map(transformItem)),
          S.chain(S.sequence(S.Maybe)),
          S.reduce_((err,val)=>Future.of(val),
                    Future.reject("Wrong DB response"))
        ]))
               
          // let items = S.get(_=> true, "Items",response)
          // let transformed = S.chain(S.map(transformItem),items)
          // let flattened = S.chain(S.sequence(S.Maybe),transformed)
          // return S.reduce((err,val)=>Future.of(val), Future.reject("Wrong DB response"),flattened)
          //      //Transform each item to Maybe<SentimentSubmittedEvent>
          //      //Then convert the
          //      //Array<Maybe<SentimentSubmittedEvent>> to
          //      //Maybe<Array<SentimentSubmittedEvent>>. If any of the
          //      //transformations failed we fail the whole
          //      //parsing. (Like the Q.all function from 'Q')
          //      .chain((seq)=>S.sequence(S.Maybe,seq.map(transformItem)))
          //      //Convert to Future
          //      .reduce((err,val)=>Future.of(val),
          //              Future.reject("Wrong DB response")))
    }
  }
}
