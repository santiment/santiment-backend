'use strict'

import Future from 'fluture'
import {InvalidInputError} from './errors'
import S from './sanctuary'


export let validationToFuture = (validation)=>validation.matchWith({
  Success: ({value})=>Future.of(value),
  Failure: ({value})=>Future.reject(InvalidInputError(value))
})
