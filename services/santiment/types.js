'use strict'
/* @flow */

export type SubmitSentimentRequest = {
  userId: UserId,
  asset: Asset,
  sentiment: Sentiment,
  date: ISODateString
}

export type Asset = "ETH"|"BTC"
export const validAssets = ["EUR","BTC"]

export type Sentiment = "bullish|bearish|catish"
export const validSentiments = ["bullish","bearish","catish"]

export type UserId = string
export type ISODateString = string
export type SentimentId = string

export type SentimentSubmittedEvent = {
  userId: UserId,
  receivedTimestamp: Date,
  submittedTimestamp: Date,
  asset: Asset,
  sentiment: Sentiment
}

export function createSubmittedEvent(request: SubmitSentimentRequest, receivedTimestamp: Date): SentimentSubmittedEvent {
  const submitted = new Date(Date.parse(request.date))

  return {
    userId: request.userId,
    asset: request.asset,
    receivedTimestamp: receivedTimestamp,
    submittedTimestamp: submitted,
    sentiment: request.sentiment
  }
}

export type GetSentimentResponseItem = {
  id: SentimentId,
  date: ISODateString,
  asset: Asset,
  sentiment: Sentiment
}

export function createGetSentimentResponseItem(event: SentimentSubmittedEvent): GetSentimentResponseItem {
  return {
    id: event.userId+"/"+event.receivedTimestamp.toISOString(),
    date: event.submittedTimestamp.toISOString(),
    asset: event.asset,
    sentiment: event.sentiment
  }
}

