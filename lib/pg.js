'use strict'

const { Pool } = require('pg')
const Future = require('fluture')


function PG(connectionString, logger) {
  const pool = new Pool({
    connectionString: connectionString
  });

  //This is lazy -- meaning the connection is opened on first query
  const clientFuture = Future.tryP( ()=>pool.connect())

  
  function query(sql){
    return clientFuture.chain(
      (client)=> Future.tryP(
	()=> client.query(sql)));

  };
  

  return {

    insertPushTokenIfNotExists: ( {token, os} ) => {

      //1. Try to insert a new row.
      const sql = {
	text: `INSERT INTO push_notifications.device_tokens (os, token)
               SELECT $1, $2
               WHERE NOT EXISTS (SELECT token FROM push_notifications.device_tokens WHERE token = $2)
               RETURNING *`,
	values: [os, token]
      }

      return query(sql)
	.chain( (result)=> {
	  //2. Check if we inserted a row. If we succeeded, return the
	  // uuid of the new record.

	  if(result.rows.length === 1) {
	    //console.log(result, result.rows)
	    return Future.of(result.rows[0].uuid)
	  } 

	  //3. Otherwise the token must have already been recorded in
	  //the db. Query it and return the uuid.

	  else if (result.rows.length === 0) {
	    
	    const sql = {
	      text:"SELECT uuid FROM push_notifications.device_tokens WHERE token = $1",
	      values: [token]
	    }

	    return query(sql).map( (result)=> {
	      //logger.info(result)
	      return result.rows[0].uuid;
	    });
	  }
	      
	  else
	    return Future.reject(new Error("Returned more than 1 value: " + result.rows.toString()))
	});
    }
    
  }
}

module.exports = PG
