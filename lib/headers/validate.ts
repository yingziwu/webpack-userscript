/**
 * @packageDocumentation
 *
 * Header schema references:
 * @see [Greasemonkey](https://sourceforge.net/p/greasemonkey/wiki/Metadata_Block/)
 * @see [Tampermonkey](https://www.tampermonkey.net/documentation.php)
 */

import { extend as extendJoi, ObjectSchema, Root, Schema } from '@hapi/joi'
import { semver } from 'joi-extension-semver'
import { SyncWaterfallHook as SWHook } from 'tapable'
import { FieldSchemaHookMap } from './hook'
import {
  BakedHeaderObject,
  HeaderObject,
  ValidationContext,
  ValidationOptions,
  ValidationResult
} from './types'

import _omit from 'lodash/omit'

export const Joi: Root = extendJoi(semver)

export const BUILTIN_FIELD_SCHEMA_FACTORIES: Record<string, () => Schema> = {
  name () {
    return Joi.any().when('$pkg.name', {
      is: Joi.string().exist(),
      then: Joi.string().default(Joi.ref('$pkg.name')),
      otherwise: Joi.string().required()
    })
  },
  version () {
    return Joi.any().when('$pkg.version', {
      is: Joi.string().exist(),
      then: Joi.semver().default(Joi.ref('$pkg.version')),
      otherwise: Joi.string().required()
        .$.custom(validateVersion).warn()
    })
  },
  description () {
    return Joi.string().default(Joi.ref('$pkg.description'))
  },
  author () {
    return Joi.alternatives().try(
      Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email(),
        url: Joi.string().uri()
      })
        .unknown(),
      Joi.string().default(Joi.ref('$pkg.author'))
    )
  },
  namespace () {
    return Joi.string()
  },
  homepageURL () {
    return Joi.string().uri()
  },
  icon () {
    return Joi.string().uri()
  },
  updateURL () {
    return Joi.string().uri()
  },
  downloadURL () {
    return Joi.string().uri()
  },
  include () {
    return Joi.array().items(Joi.string()).single()
  },
  exclude () {
    return Joi.array().items(Joi.string()).single()
  },
  match () {
    return Joi.array().items(Joi.string()).single()
  },
  require () {
    return Joi.array().items(Joi.string().uri()).single()
  },
  resource () {
    return Joi.object().pattern(/^.*$/, Joi.string().uri())
  },
  'run-at' () {
    return Joi.string().allow(
      'document-start',
      'document-body',
      'document-end',
      'document-idle',
      'context-menu'
    )
  },
  grant () {
    return Joi.alternatives().try(
      Joi.string().allow('none'),
      Joi.string().allow(
        'unsafeWindow',
        'GM_addStyle',
        'GM_deleteValue',
        'GM_listValues',
        'GM_addValueChangeListener',
        'GM_removeValueChangeListener',
        'GM_setValue',
        'GM_getValue',
        'GM_log',
        'GM_getResourceText',
        'GM_getResourceURL',
        'GM_registerMenuCommand',
        'GM_unregisterMenuCommand',
        'GM_openInTab',
        'GM_xmlhttpRequest',
        'GM_download',
        'GM_getTab',
        'GM_saveTab',
        'GM_getTabs',
        'GM_notification',
        'GM_setClipboard',
        'GM_info'
      ).alter({
        tampermonkey: (schema) => schema.allow(
          'window.close',
          'window.focus'
        )
      })
    )
  },
  noframes () {
    return Joi.boolean()
  },
  unwrap () {
    return Joi.boolean()
  }
}

export function BUILTIN_HEADER_SCHEMA_FACTORY (schema: ObjectSchema): ObjectSchema {
  return schema
    .rename(/^(.*)Url$/, '{#1}URL')
    .rename('runAt', 'run-at')
    .alter({
      tampermonkey: (schema) => (schema as ObjectSchema)
        .keys({
          homepage: Joi.string().uri(),
          source: Joi.string().uri(),
          website: Joi.string().uri(),
          defaulticon: Joi.string().uri(),
          iconURL: Joi.string().uri(),
          icon64: Joi.string().uri(),
          icon64URL: Joi.string().uri(),
          connect: Joi.string().$.custom(validateConnect).warn(),
          supportURL: Joi.string().uri(),
          webRequest: Joi.string(),
          nocompat: Joi.alternatives().try(Joi.boolean(), Joi.string())
        })
        .rename('defaultIcon', 'defaulticon')
        .rename('noCompat', 'nocompat')
        .oxor('homepage', 'homepageURL', 'source', 'website')
        .oxor('defaulticon', 'iconURL', 'icon'),
      greasemonkey: (schema) => (schema as ObjectSchema)
        .keys({
          installURL: Joi.string().uri()
        }),
      openuserjs: (schema) => (schema as ObjectSchema)
        .keys({
          copyright: Joi.string(),
          license: Joi.string(),
          supportURL: Joi.string().uri(),
          collaborator: Joi.array()
            .items(Joi.alternatives().try(
              Joi.string()
            ))
            .single()
            .default(Joi.ref('$pkg.contributors')),
          unstableMinify: Joi.string()
        })
    })
}

export const DEFAULT_VALUE_SCHEMA = Joi.alternatives().try(
  Joi.array().items(Joi.string()).single(), // string | string[]
  Joi.object().pattern(Joi.string(), Joi.string()), // {[k: string]: string}
  Joi.boolean()
)

class HeaderSchemaFactory<T = BakedHeaderObject> {
  public readonly headerSchemaHook = new SWHook<ObjectSchema>(
    ['headerSchema']
  )

  public readonly fieldSchemaHooks = new FieldSchemaHookMap()

  public constructor (
    private readonly Class: new (...args: any[]) => HeaderValidator<T>
  ) { }

  public build (ctx?: ValidationContext): HeaderValidator<T> {
    const schemaObj: Record<string, Schema> = {}
    for (const [field, fieldSchemaHook] of this.fieldSchemaHooks) {
      schemaObj[field] = fieldSchemaHook.call(DEFAULT_VALUE_SCHEMA)
    }
    return new this.Class(
      this.headerSchemaHook.call(Joi.object(schemaObj))
        .pattern(/^.*$/, DEFAULT_VALUE_SCHEMA),
      ctx
    )
  }

  public installBuiltins (): void {
    const name = '__builtins__'

    this.headerSchemaHook.tap(name, BUILTIN_HEADER_SCHEMA_FACTORY)

    for (const [field, fieldSchemaFactory]
      of Object.entries(BUILTIN_FIELD_SCHEMA_FACTORIES)) {
      this.fieldSchemaHooks.for(field).tap(name, fieldSchemaFactory)
    }
  }
}

export class HeaderValidator<T = BakedHeaderObject> {
  public readonly contextHook = new SWHook<ValidationContext>(['context'])

  public constructor (
    public schema: ObjectSchema,
    public context: ValidationContext = {}
  ) { }

  public validate (
    headers: HeaderObject,
    options: ValidationOptions = {}
  ): ValidationResult<T> {
    const schema = typeof options.target !== 'undefined'
      ? this.schema.tailor(options.target) as ObjectSchema : this.schema
    return schema.validate(headers, {
      stripUnknown: false,
      ..._omit(options, 'target'),
      context: this.contextHook.call(this.context)
    })
  }

  public static factory<U = BakedHeaderObject> (): HeaderSchemaFactory<U> {
    return new HeaderSchemaFactory<U>(this)
  }
}

/**
 * @internal
 */
const versionSchema = Joi.semver().valid().tag('version')

/**
 * @internal
 */
function validateVersion (v: any): any {
  const { value, error } = versionSchema.validate(v)
  if (typeof error !== 'undefined') { throw error }
  return value
}

/**
 * @internal
 */
const connectSchema = Joi.alternatives().try(
  Joi.string().hostname(),
  Joi.string().ip(),
  Joi.allow('localhost', 'self', '*')
)

/**
 * @internal
 */
function validateConnect (v: any): any {
  const { value, error } = connectSchema.validate(v)
  if (typeof error !== 'undefined') { throw error }
  return value
}

// /**
//  * @internal
//  */
// interface Developer {
//   name?: string
//   email?: string
//   url?: string
// }

// /**
//  * @internal
//  */
// function formatDeveloperObject (e: Developer): string {
//   let ret = ''
//   if (typeof e.name === 'string') {
//     ret += e.name
//   }
//   if (typeof e.email === 'string') {
//     ret += `<${e.email}>`
//   }
//   if (typeof e.url === 'string') {
//     ret += `(${e.url})`
//   }
//   return ret
// }
