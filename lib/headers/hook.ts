import { Schema } from '@hapi/joi'
import { SyncWaterfallHook } from 'tapable'

export class FieldSchemaHookMap {
  protected _map: Map<string, SyncWaterfallHook<Schema>> = new Map()

  public for (field: string): SyncWaterfallHook<Schema> {
    let hook = this._map.get(field)
    if (typeof hook === 'undefined') {
      hook = new SyncWaterfallHook<Schema>([`${field}FieldSchema`])
      this._map.set(field, hook)
    }
    return hook
  }

  public * [Symbol.iterator] (): Iterator<[string, SyncWaterfallHook<Schema>]> {
    for (const item of this._map) {
      yield item
    }
  }
}
