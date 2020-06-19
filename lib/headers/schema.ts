import libjoi from '@hapi/joi'
import { semver } from 'joi-extension-semver'

const Joi: libjoi.Root = libjoi.extend(semver)

export const headerSchema = Joi.object({
  name: Joi.string().default(Joi.ref('$pkg.name')).required(),
  version: Joi.semver().default(Joi.ref('$pkg.version')).required(),
  description: Joi.string().default(Joi.ref('$pkg.description')),
  author: Joi.string().default(Joi.ref('$pkg.author')),
  namespace: Joi.string(),
  collaborator: Joi.array().items(Joi.string()).single()
    .default(Joi.ref('$pkg.contributors')),
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
  supportURL: Joi.string(),

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
