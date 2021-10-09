const test = require('tape')
const webpack = require('webpack')
const path = require('path')
const fs = require('fs')
const MemoryFileSystem = require('memory-fs')
const express = require('express')

const WebpackUserscript = require('../..')

const TEST_DIR = path.dirname(__dirname)
const FIXTURE_DIR = path.join(TEST_DIR, 'fixtures')
const ASSETS_DIR = path.join(TEST_DIR, 'assets')

async function startHTTPServer (assetsDir) {
  const app = express()
  app.use(express.static(assetsDir))
  return new Promise((resolve, reject) => {
    const server = app.listen()
    server.on('listening', () => resolve(server))
    server.on('error', (e) => reject(e))
  })
}

const pServer = startHTTPServer(ASSETS_DIR)
test.onFinish(async () => (await pServer).close())

const testcases = [
  {
    name: 'ssri-enabled',
    ssri: true // ssri defaults to use sha512
  },
  {
    name: 'ssri-options',
    ssri: {
      include: /@require/,
      exclude: /index\.js/,
      algorithms: [
        'sha256',
        'sha512'
      ]
    }
  }
]

for (const { name, ssri } of testcases) {
  test(name, async function (t) {
    t.plan(2)

    const context = path.resolve(FIXTURE_DIR, name)

    const server = await pServer
    const { port } = server.address()
    const expectedUserJS = fs.readFileSync(path.join(context, 'expected.user.js'), 'utf8')
      .replace(/@PORT@/g, port)
    const expectedMetaJS = fs.readFileSync(path.join(context, 'expected.meta.js'), 'utf8')
      .replace(/@PORT@/g, port)

    const compiler = webpack({
      ...require(path.resolve(context, 'webpack.config.js')),
      context,
      plugins: [
        new WebpackUserscript({
          headers: {
            require: [
              `http://localhost:${port}/jquery-3.4.1.min.js`,
              `http://localhost:${port}/index.js`
            ],
            resource: `svg http://localhost:${port}/travis-webpack-userscript.svg`
          },
          ssri
        })
      ]
    })
    const outputFS = compiler.outputFileSystem = new MemoryFileSystem()

    compiler.run((err, stats) => {
      if (err) {
        console.error(err.stack || err)
        if (err.details) {
          console.error(err.details)
        }

        t.end(err)
        return
      }

      const info = stats.toJson()

      if (stats.hasErrors()) {
        console.error(info.errors)
        t.end(new Error('Fixture errors.'))
        return
      }

      if (stats.hasWarnings()) {
        console.warn(info.warnings)
      }

      const output = outputFS.readFileSync(
        path.join(context, 'output', 'index.user.js'),
        'utf8'
      )
      t.same(output, expectedUserJS)

      const meta = outputFS.readFileSync(
        path.join(context, 'output', 'index.meta.js'),
        'utf8'
      )
      t.same(meta, expectedMetaJS)
    })
  })
}
