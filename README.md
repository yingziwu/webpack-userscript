# webpack-userscript
[![Build Status](https://travis-ci.org/momocow/webpack-userscript.svg?branch=master)](https://travis-ci.org/momocow/webpack-userscript)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/v/webpack-userscript.svg)](https://www.npmjs.com/webpack-userscript)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.carloscuesta.me/)

A Webpack5 plugin for bundling userscripts. 🙈

## Features
- Ability to generate userscript headers
- Ability to generate both `.user.js` and `.meta.js`
  > `.meta.js` is used for update check containing headers only.
- Webpack watch mode support
- Development integrated with Webpack Dev Server and userscript engines like TamperMonkey.
- [SRI](https://w3c.github.io/webappsec-subresource-integrity/) support for `@require` and `@resource` URLs

## Installation
```bash
npm i webpack-userscript@next -D
```


## User Guide
### Usage
Include the plugin in the `webpack.config.js` as follows,

```js
const WebpackUserscript = require('webpack-userscript')

module.exports = {
  plugins: [
    new WebpackUserscript()
  ]
}
```

### Quick Start
#### Hot Development
The following example can be used in development mode with the help of [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server).

`webpack-dev-server` will build the userscript in the **watch** mode.

In the following configuration, a portion of the `version` contains a `buildTime`; therefore, each time there is a build, the `version` is also increased so as to indicate a new update available for userscript engines like Tampermonkey or GreaseMonkey.

After the first time starting `webpack-dev-server`, you can install the built userscript via `http://localhost:8080/<project-name>.user.js` (the URL is actually refered to your configuration for `webpack-dev-server` via `devServer` key). Once installed, there is no need to manually reinstall the userscript until you stop the server. To update the userscript, your userscript engine has an **update** button on the GUI for you.

- `webpack.config.dev.js`
```js
const path = require('path')
const WebpackUserscript = require('webpack-userscript')
const dev = process.env.NODE_ENV === 'development'

module.exports = {
  mode: dev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src', 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '<project-name>.user.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  },
  plugins: [
    new WebpackUserscript({
      headers: {
        version: dev ? `[version]-build.[buildTime]` : `[version]`
      }
    })
  ]
}
```

#### Integration with Webpack Dev Server and TamperMonkey
If you feel tired with firing the update button on TamperMonkey GUI, maybe you can have a try at proxy scripts.

A proxy script actually looks similar to `*.meta.js` except that it contains additional `@require` field to include your main userscript. A proxy script is used since TamperMonkey has an option that makes external scripts always be update-to-date without caching, and external scripts are included into userscripts via the `@require` header field. (You may also want to read this comment, [Tampermonkey/tampermonkey#767](https://github.com/Tampermonkey/tampermonkey/issues/767#issuecomment-542813282))

To avoid caching and make the main script always be updated after each page refresh, you have to make your main userscript **"an external resource"** to TamperMonkey. That is where a proxy script comes in, it provides TamperMonkey with a `@require` field pointing to the URL of the main userscript on the dev server, and each time you reload your target page, it will trigger the update.

> Actually it requires 2 reloads for each change to take effect on the page.
>
> The first reload trigger the update of external script but without execution (it runs the legacy version of the script), the second reload will start to run the updated script.

To enable proxy scripts, provide a `proxyScript` configuration to the plugin constructor.

Set `proxyScript.enable` to `true` will always enable proxy script, or you can provide a function that returns a boolean. In the example below, the proxy script is enabled if the environment contains a variable, `LOCAL_DEV`, and the variable equals to `"1"`.

`baseUrl` should be the base URL of the dev server, and the `filename` is for the proxy script.

After starting the dev server, you can find your proxy script under `<baseUrl>/<filename>`. In the example below, assume the entry filename is `index.js`, you should visit `http://127.0.0.1:12345/index.proxy.user.js` to install the proxy script on TamperMonkey.

```js
new WebpackUserscript({
  // <...your other configs...>,
  proxyScript: {
    baseUrl: 'http://127.0.0.1:12345',
    filename: '[basename].proxy.user.js',
    enable: () => process.env.LOCAL_DEV === '1'
  }
})
```

### Configuration

```
```

## API
