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
import { HeaderObject, ValidationContext, ValidationOptions, BakedHeaderObject, ValidationResult } from './types'

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
        email: Joi.string().$.email().warn(),
        url: Joi.string().$.uri().warn()
      })
        .unknown()
        .custom(formatDeveloperObject),
      Joi.string().default(Joi.ref('$pkg.author'))
    )
  },
  namespace () {
    return Joi.string()
  },
  homepageURL () {
    return Joi.string().$.uri().warn()
  },
  icon () {
    return Joi.string().$.uri().warn()
  },
  updateURL () {
    return Joi.string().$.uri().warn()
  },
  downloadURL () {
    return Joi.string().$.uri().warn()
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
    return Joi.array().items(Joi.string().$.uri().warn()).single()
  },
  resource () {
    return Joi.object().pattern(/^.*$/, Joi.string().$.uri().warn())
  },
  'run-at' () {
    return Joi.string()
      .$.allow(
        'document-start',
        'document-body',
        'document-end',
        'document-idle',
        'context-menu'
      ).warn()
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
          homepage: Joi.string().$.uri().warn(),
          source: Joi.string().$.uri().warn(),
          website: Joi.string().$.uri().warn(),
          defaulticon: Joi.string().$.uri().warn(),
          iconURL: Joi.string().$.uri().warn(),
          icon64: Joi.string().$.uri().warn(),
          icon64URL: Joi.string().$.uri().warn(),
          connect: Joi.string().$.custom(validateConnect).warn(),
          supportURL: Joi.string().$.uri().warn(),
          webRequest: Joi.string(),
          nocompat: Joi.alternatives().try(Joi.boolean(), Joi.string())
        })
        .rename('defaultIcon', 'defaulticon')
        .rename('noCompat', 'nocompat')
        .oxor('homepage', 'homepageURL', 'source', 'website')
        .oxor('defaulticon', 'iconURL', 'icon'),
      greasemonkey: (schema) => (schema as ObjectSchema)
        .keys({
          installURL: Joi.string().$.uri().warn()
        }),
      openuserjs: (schema) => (schema as ObjectSchema)
        .keys({
          copyright: Joi.string(),
          license: Joi.string(),
          supportURL: Joi.string().$.uri().warn(),
          collaborator: Joi.array()
            .items(Joi.alternatives().try(
              Joi.string(),
            ))
            .single()
            .default(Joi.ref('$pkg.contributors'))
          // unstableMinify
        })
    })
}

export const DEFAULT_VALUE_SCHEMA = Joi.alternatives().try(
  Joi.array().items(Joi.string()).single(), // string | string[]
  Joi.object().pattern(Joi.string(), Joi.string()), // {[k: string]: string}
  Joi.boolean()
)

export class HeaderValidator<T = BakedHeaderObject> {
  public static readonly headerSchemaHook = new SWHook<ObjectSchema>(
    ['headerSchema']
  )

  public static readonly fieldSchemaHooks = new FieldSchemaHookMap()

  public readonly contextHook = new SWHook<ValidationContext>(['context'])

  protected constructor (
    public schema: ObjectSchema,
    public context: ValidationContext = {}
  ) { }

  public validate (
    headers: HeaderObject,
    options: ValidationOptions = {}
  ): ValidationResult<T> {
    return this.schema.validate(headers, {
      stripUnknown: false,
      ...options,
      context: this.contextHook.call(this.context)
    })
  }

  public static create (ctx?: ValidationContext): HeaderValidator {
    const schemaObj: Record<string, Schema> = {}
    for (const [field, fieldSchemaHook] of this.fieldSchemaHooks) {
      schemaObj[field] = fieldSchemaHook.call(DEFAULT_VALUE_SCHEMA)
    }
    return new HeaderValidator(
      this.headerSchemaHook.call(Joi.object(schemaObj)),
      ctx
    )
  }

  public static installBuiltins (): void {
    const name = '__builtins__'

    this.headerSchemaHook.tap(name, BUILTIN_HEADER_SCHEMA_FACTORY)

    for (const [field, fieldSchemaFactory]
      of Object.entries(BUILTIN_FIELD_SCHEMA_FACTORIES)) {
      HeaderValidator.fieldSchemaHooks.for(field).tap(name, fieldSchemaFactory)
    }
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

/**
 * @internal
 */
interface Developer {
  name?: string
  email?: string
  url?: string
}

/**
 * @internal
 */
function formatDeveloperObject (e: Developer): string {
  let ret = ''
  if (typeof e.name === 'string') {
    ret += e.name
  }
  if (typeof e.email === 'string') {
    ret += `<${e.email}>`
  }
  if (typeof e.url === 'string') {
    ret += `(${e.url})`
  }
  return ret
}
