export type Optional<T> = T | undefined

export type HeaderValue = string | string[] | boolean

/**
 * The `@default` tag is an URI with its fragment a
 * [JSON pointer](https://tools.ietf.org/html/rfc6901) which indicates the source
 * of its default value, typically starting from a `package.json`.
 *
 * The `@see` tag represents appositive fields.
 *
 * The `@alias` tag represents name alias which will be renamed back to the origin
 * field names when rendering. It exists typically for camelcase naming convention.
 */
export interface HeaderObject {
  /**
   * @default `package.json#/name`
   */
  name?: string

  /**
   * @default `package.json#/description`
   */
  description?: string

  /**
   * @default `package.json#/version`
   */
  version?: string

  /**
   * @default `package.json#/author`
   */
  author?: string

  /**
   * @default `package.json#/homepage`
   */
  homepage?: string

  /**
   * @see {@link HeaderObject.homepage}
   */
  homepageURL?: string

  /**
   * @alias {@link HeaderObject.homepageURL}
   */
  homepageUrl?: string

  /**
   * @see {@link HeaderObject.homepage}
   */
  website?: string

  /**
   * @see {@link HeaderObject.homepage}
   */
  source?: string

  namespace?: string

  icon?: string

  /**
   * @see {@link HeaderObject.icon}
   */
  iconURL?: string

  /**
   * @alias {@link HeaderObject.iconURL}
   */
  iconUrl?: string

  /**
   * @see {@link HeaderObject.icon}
   */
  defaulticon?: string

  /**
   * @alias {@link HeaderObject.defaulticon}
   */
  defaultIcon?: string

  icon64?: string

  /**
   * @see {@link HeaderObject.icon64}
   */
  icon64URL?: string

  /**
   * @alias {@link HeaderObject.icon64URL}
   */
  icon64Url?: string

  updateURL?: string

  /**
   * @alias {@link HeaderObject.updateURL}
   */
  updateUrl?: string

  downloadURL?: string

  /**
   * @alias {@link HeaderObject.downloadURL}
   */
  downloadUrl?: string

  installURL?: string

  /**
   * @alias {@link HeaderObject.installURL}
   */
  installUrl?: string

  supportURL?: string

  /**
   * @alias {@link HeaderObject.supportURL}
   */
  supportUrl?: string

  include?: string | string[]

  match?: string | string[]

  exclude?: string | string[]

  require?: string | string[]

  resource?: string | string[]

  connect?: string | string[]

  'run-at'?: string

  /**
   * @alias {@link HeaderObject.run-at}
   */
  runAt?: string

  grant?: string | string[] | 'none'

  webRequest?: string

  noframes?: boolean

  /**
   * @alias {@link HeaderObject.noframes}
   */
  noFrames?: boolean

  unwrap?: boolean

  nocompat?: boolean | string

  /**
   * @alias {@link HeaderObject.nocompat}
   */
  noCompat?: boolean

  [field: string]: Optional<HeaderValue>
}

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
