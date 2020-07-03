export type Optional<T> = T | undefined

export type HeaderFile = string

export interface DataObject {
  hash: string
  fullhash: string

  /**
   * Webpack chunk name.
   */
  chunkName: string

  /**
   * Entry file path, which may contain queries.
   */
  file: string

  /**
   * Just like `file` but without queries.
   */
  filename: string

  /**
   * Just like `filename` but without file extension, i.e. ".user.js" or ".js".
   */
  basename: string

  /**
   * Query string.
   */
  query: string

  /**
   * The POSIX timestamp in ms represents the time when
   * the header object is about to be generated.
   */
  buildTime: number

  /**
   * `package.json#/name`
   */
  name: string

  /**
   * `package.json#/version`
   */
  version: string

  /**
   * `package.json#/description`
   */
  description: string

  /**
   * `package.json#/author`
   */
  author: string

  /**
   * `package.json#/homepage`
   */
  homepage: string

  /**
   * `package.json#/bugs` or `package.json#/bugs/url`
   */
  bugs: string
}

export type HeaderProvider = (data: DataObject) => HeaderObject

export interface WebpackUserscriptOptions {
  headers?: HeaderObject | HeaderObject | HeaderProvider
}
