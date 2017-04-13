"use strict"
/* @flow */

const $ = require('sanctuary-def');
const Future = require('fluture');
const {env, create} = require('sanctuary');

const FutureType = $.BinaryType(
  Future.name,
  'https://github.com/fluture-js/Fluture#future',
  Future.isFuture,
  Future.extractLeft,
  Future.extractRight
);

export default create({checkTypes: false, env: env.concat([FutureType])});
