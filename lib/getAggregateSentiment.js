"use strict"
/* @flow */

import Future from  'fluture'
import Validation from 'folktale/data/validation'
import S from './sanctuary'
import moment from 'moment'
import {validationToFuture} from './util'

const {Success,Failure} = Validation

/*flow-include

import type {Asset, ISODateString} from './types'

type SingleDateRequest = {
  date: ISODateString,
  asset: Asset
}

type DateRangeRequest = {
  from: ISODateString,
  to: ISODateString,
  asset: Asset
}

type GetAggregateRequest = SingleDateRequest|DateRangeRequest

type SingleDateResponse = {
  bullish: Number,
  bearish: Number,
  catish: Number
}

type DateRangeResponse = Array<DateRangeResponseEntry>
type DateRangeResponseEntry = {
  date:ISODateString,
  bullish: Number,
  bearish: Number,
  catish: Number
  }

type GetAggregateResponse = SingleDateResponse|DateRangeResponse
*/

const SingleDateRequest = (date)=>(asset)/*:SingleDateRequest*/=>({
  date: date,
  asset: asset
})

const DateRangeRequest = (from)=>(to)=>(asset)/*:DateRangeRequest*/=>({
  from: from,
  to: to,
  asset: asset
})

export default function getAggregateSentiment (db/*:any*/) {
  return (event/*:any*/)=>{
    return validationToFuture(validateRequest(event))
      .chain((request)=>{
        if(request["from"] != null) {
          return getDateRangeSentiment(db)(request)
        } else {
          return getSingleDateSentiment(db)(request)             
        }
      })
  }
}


function validateRequest(event){
  if (event == null)
    return Failure(["No event given"])

  let params = event.queryStringParameters

  if (params == null)
    return Failure(["No query string given"])

  if ((params.date == null) && (params.from==null))
    return Failure(["Neither 'date' nor 'from' parameter present in query string"])
  
  if (params.date != null) {
    //Single date request
    return validateSingleDateRequest(params)
  } else {
    //Date range request
    return validateDateRangeRequest(params)
  }
}

function failUnless(bool,error){
  if(bool) {
    return Success()
  } else {
    return Failure(error)
  }
}

function validateDateOnly (date){
  let conv = moment(date,"YYYY-MM-DD",true)
  return failUnless(conv.isValid(),[`Date field '${date}' must have format YYYY-MM-DD`]).concat(Success(date))
}

const validateAsset = (asset)=>Validation.fromNullable(asset,["No 'asset' given"])

function validateSingleDateRequest(params){
  return Success(SingleDateRequest)
    .apply(validateDateOnly(params.date))
    .apply(validateAsset(params.asset))
}

function validateDateRangeRequest(params){
  return Success(DateRangeRequest)
    .apply(validateDateOnly(params.from))
    .apply(validateDateOnly(params.to))
    .apply(validateAsset(params.asset))
}

  

function getSingleDateSentiment(db){
  return (request)=>
    db.getSentimentPerAsset(request.asset,request.date,moment(request.date).endOf('day').toISOString())
    .map(x=>{console.log(x);return x})
    .map(x=>x[request.date])
  
  
}

function getDateRangeSentiment(db){
  return (request/*:DateRangeRequest*/)/*:Future<DateRangeResponse>*/=>
    db.getSentimentPerAsset(request.asset,request.from,request.to)
    .map( S.pipe([
      S.pairs,
      S.map( ([date,value])=>({
        date:date,
        bullish:value.bullish,
        bearish:value.bearish,
        catish:value.catish
      }))]))
}
