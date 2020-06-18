import { Compiler } from 'webpack'

import { WebpackUserscriptOptions } from './types'

export class WebpackUserscript {
  constructor (public options: WebpackUserscriptOptions) {
  }

  public apply (compiler: Compiler): void {
  }
}
