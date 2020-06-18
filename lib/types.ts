export type Optional<T> = T | undefined

export type RunAt =
  'document-start' |
  'document-body' |
  'document-end' |
  'document-idle' |
  'context-menu'

/**
 * This interface is designed heavily against
 * [Tampermonkey API](https://www.tampermonkey.net/documentation.php),
 * e.g. string literal types for `@run-at`.
 * However, extensibility is preserved for other userscript engines
 * e.g. `@run-at` also accepts primitive string types.
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
   * @see {@link HeaderObject.homepage}
   */
  website?: string

  /**
   * @see {@link HeaderObject.homepage}
   */
  source?: string

  namespace?: string

  icon?: string
  iconURL?: string
  defaulticon?: string

  icon64?: string
  icon64URL?: string

  updateURL?: string

  downloadURL?: string
  installURL?: string

  supportURL?: string

  include?: string | string[]

  match?: string | string[]

  exclude?: string | string[]

  require?: string | string[]

  resource?: string | string[]

  connect?: string | string[]

  'run-at'?: RunAt

  grant?: string | string[] | 'none'

  webRequest?: string

  noframes?: boolean

  unwrap?: boolean

  nocompat?: boolean | string

  [field: string]: string | string[] | boolean | undefined
}

export type HeaderFile = string

// export interface DataObject {
// }

// export type HeaderProvider = (data: DataObject) => HeaderObject

export interface WebpackUserscriptOptions {
  headers: HeaderObject // | HeaderObject | HeaderProvider
}
