'use strict'

const Future = require('fluture')

module.exports = ({elasticsearch,host,apiVersion})=>{
  const client = new elasticsearch.Client({
    host,
    apiVersion
  })

  const search = (param)=>Future.node( done => client.search(param,done))

  return {
    trollboxFeed(keyword, size){
      const result = search({
        index: "datafeed",
        type: "trollbox_message",
        df:"message",
        q:keyword,
        size:size,
        sort:"trollboxCounter:desc"
      })

      const hits = result.map( (r)=>{
        //console.log(r)
        return r.hits.hits.map(h=>{
          //console.log(h)
          const source = h._source
          return {
            receivedTimestamp: source.receivedTimestamp,
            message: source.message,
            username: source.trollboxUsername,
            counter: source.trollboxCounter,
            reputation: source.trollboxReputation
          }
          return h._source
        })
      })
      return hits
    }
  }

}
