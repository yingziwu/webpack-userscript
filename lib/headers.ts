import validate from 'schema-utils'

export type RunAt =
  'document-start' |
  'document-body' |
  'document-end' |
  'document-idle' |
  'context-menu'

export type Grant =
  'unsafeWindow' |
  'GM_addStyle' |
  'GM_deleteValue' |
  'GM_listValues' |
  'GM_addValueChangeListener' |
  'GM_removeValueChangeListener' |
  'GM_setValue' |
  'GM_getValue' |
  'GM_log' |
  'GM_getResourceText' |
  'GM_getResourceURL' |
  'GM_registerMenuCommand' |
  'GM_unregisterMenuCommand' |
  'GM_openInTab' |
  'GM_xmlhttpRequest' |
  'GM_download' |
  'GM_getTab' |
  'GM_saveTab' |
  'GM_getTabs' |
  'GM_notification' |
  'GM_setClipboard' |
  'GM_info' |
  'window.close' |
  'window.focus' |
  'none'

export interface HeaderObject {
  name: string
  namespace: string
  version: string
  author: string
  description: string
  homepage: string
  homepageURL: string
  website: string
  source: string
  icon: string
  iconURL: string
  defaulticon: string
  icon64: string
  icon64URL: string
  updateURL: string
  downloadURL: 'none' | string
  installURL: string
  supportURL: string
  include: string | string[]
  match: string | string[]
  exclude: string | string[]
  require: string | string[]
  resource: string | string[]
  connect: string | string[]
  'run-at': RunAt | string
  grant: Grant | string
  webRequest: string
  noframes: boolean
  unwrap: boolean
  nocompat: boolean | string

  /**
   * Alias for the `run-at` field
   */
  runAt: HeaderObject['run-at']

  [field: string]: string | string[] | boolean
}

export class HeaderMap extends Map<string, string[]> {
  constructor (headers: Partial<HeaderObject> = {}) {
    super()

    for (const [k, v] of Object.entries(headers)) {
      this.set(k, v)
    }
  }

  public set (k: K, v: HeaderObject[K] = true): void {
    // if (k === '')
  }

  public get [Symbol.toStringTag] (): string {
    return this.format()
  }

  public format (pretty: boolean = true): string {

  }
}

let m = new HeaderMap({ connect: 'none' })
