import libjoi from '@hapi/joi'
import { semver } from 'joi-extension-semver'
import { HeaderObject, HeaderValue } from './types'
import { HookMap, SyncWaterfallHook } from 'tapable'

/**
 * @internal
 */
const Joi: libjoi.Root = libjoi.extend(semver)

/**
 * @internal
 */
function formatContributor (c: Record<string, string>): string {
  const tokens: string[] = []
  if (typeof c.name === 'string') {
    tokens.push(c.name)
  }
  if (typeof c.email === 'string') {
    tokens.push(`<${c.email}>`)
  }
  if (typeof c.url === 'string') {
    tokens.push(`(${c.url})`)
  }
  return tokens.join(' ')
}

/**
 * @internal
 */
const versionSchema = Joi.semver().valid().tag('version')

/**
 * @internal
 */
function validateVersion (v: any, helpers: libjoi.CustomHelpers): any {
  const { value, error } = versionSchema.validate(v)
  if (typeof error !== 'undefined') { throw error }
  return value
}

const connectSchema = Joi.alternatives().try(
  Joi.string().hostname(),
  Joi.string().ip(),
  Joi.allow('localhost', 'self', '*')
)

/**
 * @internal
 */
function validateConnect (v: any, helpers: libjoi.CustomHelpers): any {
  const { value, error } = connectSchema.validate(v)
}

/**
 * @internal
 */
const packageSchema = Joi.object({
  name: Joi.string(),
  version: Joi.string()
    .$.custom(validateVersion).warn(),
  description: Joi.string(),
  author: Joi.string(),
  homepage: Joi.string().$.uri().warn(),
  bugs: Joi.alternatives()
    .try(
      Joi.string().$.uri().warn(),
      Joi.object({
        url: Joi.string().$.uri().warn()
      })
    )
    .custom((v) => typeof v === 'object' ? v.url : v),
  contributors: Joi.array().items(
    Joi.string(),
    Joi.object({
      name: Joi.string(),
      email: Joi.string(),
      url: Joi.string()
    })
  )
    .custom((v) => typeof v === 'object' ? formatContributor(v) : v)
})

export interface ValidationSuccess<V> { value: V }
export interface ValidationFailure { warning?: Error, error?: Error }
export type ValidationResult<V> = ValidationSuccess<V> | ValidationFailure

export class HeaderValidator {
  public hooks = new HookMap(
    (field: string) => new SyncWaterfallHook([`schema:${field}`])
  )

  // {
  //   enumerateGrants: new SyncWaterfallHook(['grants']),
  //   buildSchema: new SyncWaterfallHook(['descriptor'])
  // }

  public validate (
    hdrsIn: HeaderObject, pkgIn: Record<string, any>
  ): ValidationResult<Record<string, HeaderValue>> {
    const {
      value: pkgCtx, error: pkgErr, warning: pkgWarn
    } = packageSchema.validate(pkgIn, {
      stripUnknown: true
    })
    if (typeof pkgWarn !== 'undefined' || typeof pkgErr !== 'undefined') {
      return { error: pkgErr, warning: pkgWarn }
    }
    const { value, error, warning } = headerSchema.validate(hdrsIn, {
      context: pkgCtx,
      stripUnknown: false
    })
    if (typeof warning !== 'undefined' || typeof error !== 'undefined') {
      return { error, warning }
    }
    return { value }
  }
}

// 'window.close',
// 'window.focus'

const headerSchema = Joi.object({
  name: Joi.any().when('$pkg.name', {
    is: Joi.string().exist(),
    then: Joi.string().default(Joi.ref('$pkg.name')),
    otherwise: Joi.string().required()
  }),
  version: Joi.any().when('$pkg.version', {
    is: Joi.string().exist(),
    then: Joi.semver().default(Joi.ref('$pkg.version')),
    otherwise: Joi.string().required()
      .$.custom(validateVersion).warn()
  }),
  description: Joi.string().default(Joi.ref('$pkg.description')),
  author: Joi.string().default(Joi.ref('$pkg.author')),
  collaborator: Joi.array()
    .items(Joi.string())
    .single()
    .default(Joi.ref('$pkg.contributors')),
  namespace: Joi.string(),
  copyright: Joi.string(),
  license: Joi.string(),
  homepageURL: Joi.string(),
  icon: Joi.string(),
  updateURL: Joi.string(),
  downloadURL: Joi.string(),
  include: Joi.array().items(Joi.string()).single(),
  exclude: Joi.array().items(Joi.string()).single(),
  match: Joi.array().items(Joi.string()).single(),
  require: Joi.array().items(Joi.string().$.uri().warn()).single(),
  resource: Joi.object().pattern(/^.*$/, Joi.string().$.uri().warn()),
  'run-at': Joi.string()
    .$.allow(
      'document-start',
      'document-body',
      'document-end',
      'document-idle',
      'context-menu'
    ).warn(),
  grant: Joi.string()
    .$.allow(
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
    .warn(),
  noframes: Joi.boolean(),
  unwrap: Joi.boolean()
})
  // @see https://github.com/DefinitelyTyped/DefinitelyTyped/pull/45677
  .rename(/^(.*)Url$/ as unknown as string, '{#1}URL')
  .rename('runAt', 'run-at')
  .alter({
    tampermonkey: (schema) => (schema as libjoi.ObjectSchema)
      .append({
        homepage: Joi.string(),
        source: Joi.string(),
        website: Joi.string(),
        supportURL: Joi.string(),
        defaulticon: Joi.string(),
        iconURL: Joi.string(),
        icon64: Joi.string(),
        icon64URL: Joi.string(),
        connect: Joi.string().custom(),
        webRequest: Joi.string()
        // nocompat
      })
      .rename('defaultIcon', 'defaulticon'),
    greasemonkey: (schema) => (schema as libjoi.ObjectSchema)
      .append({
        installURL: Joi.string()
      })
  })
