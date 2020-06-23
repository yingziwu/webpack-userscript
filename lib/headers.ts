import libjoi from '@hapi/joi'
import { semver } from 'joi-extension-semver'
import { HeaderObject, HeaderValue } from './types'

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

const packageSchema = Joi.object({
  name: Joi.string(),
  version: Joi.semver().valid(),
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

export function validate (
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

const headerSchema = Joi.object({
  name: Joi.any()
    .when('$pkg.name', { // .when() is used to validate the value from context
      is: Joi.string().exist(),
      then: Joi.string().default(Joi.ref('$pkg.name')),
      otherwise: Joi.string().required()
    }),
  version: Joi.any()
    .when('$pkg.version', {
      is: Joi.string().exist(),
      then: Joi.semver().default(Joi.ref('$pkg.version')),
      otherwise: Joi.semver().valid().required()
    }),
  description: Joi.string()
    .default(Joi.ref('$pkg.description')),
  author: Joi.string()
    .default(Joi.ref('$pkg.author')),
  collaborator: Joi.array().items(Joi.string()).single()
    .default(Joi.ref('$pkg.contributors')),
  namespace: Joi.string(),
  copyright: Joi.string(),
  license: Joi.string(),
  homepage: Joi.string(),
  homepageURL: Joi.string(),
  website: Joi.string(),
  source: Joi.string(),
  icon: Joi.string(),
  iconURL: Joi.string(),
  defaulticon: Joi.string(),
  icon64: Joi.string(),
  icon64URL: Joi.string(),
  updateURL: Joi.string(),
  downloadURL: Joi.string(),
  installURL: Joi.string(),
  supportURL: Joi.string()

  // include
  // exclude
  // match
  // require
  // resource
  // 'run-at'
  // grant
  // noframes
  // unwrap
  // connect
  // webRequest
  // nocompat
})
  .rename(/^(.*)Url$/, '{#1}URL')
