import libjoi from '@hapi/joi'
import { semver } from 'joi-extension-semver'
import { HeaderObject } from './types'

/**
 * @internal
 */
interface PackageObject {
  name?: string
  version?: string
  description?: string
  author?: string
  homepage?: string
  bugs?: string | { url: string }
}

/**
 * @internal
 */
interface CookedHeaderObject {

}

const Joi: libjoi.Root = libjoi.extend(semver)

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
    .custom((v) => typeof v === 'object' ? v.url : v)
})

export function validate (hdrs: HeaderObject, pkg: PackageObject) {
  packageSchema.validate(pkg)
}

console.log(packageSchema.validate({
  name: 'test',
  version: '1.2.3-alpha.1',
  homepage: 'http://1234.com',
  bugs: { url: 'http://1234.com' },
  additional: true
}, { stripUnknown: true }))

const headerSchema = Joi.object({
  name: Joi.string()
    .when('$pkg.name', { // .when() is used to validate the value from context
      is: Joi.string().exist(),
      then: Joi.string().default(Joi.ref('$pkg.name')),
      otherwise: Joi.string().required()
    }),
  version: Joi.semver().valid()
    .when('$pkg.version', {
      is: Joi.semver().exist().valid(),
      then: Joi.semver().default(Joi.ref('$pkg.version')),
      otherwise: Joi.semver().required()
    }),
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

// console.log(headerSchema.validate({
// }, {
//   context: {
//     pkg: {
//       name: 'test',
//       version: '123'
//     }
//   }
// }))
