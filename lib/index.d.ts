import {Compiler, WebpackPluginInstance} from 'webpack';

declare namespace WebpackUserscript {
  type WebpackUserscriptOptions =
    | WPUSOptions
    | HeaderFile // shorthand for WPUSOptions.headers
    | HeaderProvider; // shorthand for WPUSOptions.headers

  interface ProxyScriptOptions {
    /**
     * Filename template of the proxy script.
     * Defaults to "[basename].proxy.user.js".
     */
    filename?: string;

    /**
     * Base URL of the dev server.
     * Defaults to "http://localhost:8080/".
     */
    baseUrl?: string;

    /**
     * Enable proxy script generation or not.
     * Default value depends on whether `process.env.WEBPACK_DEV_SERVER` is `"true"` or not.
     */
    enable?: boolean | (() => boolean);
  }

  interface SsriOptions {
    /**
     * URL filters.
     * Each of them is actually testing against a string compound of the meta field and the URL.
     * For example, if a header is provided as `{ require: "http://example.com/sth.js" }`,
     * a string of "// @require http://example.com/sth.js" is tested with the provided filters.
     */
    include?: string | RegExp | string[] | RegExp[];
    exclude?: string | RegExp | string[] | RegExp[];

    /**
     * @see https://github.com/npm/ssri#--integritystreamopts---integritystream
     */
    algorithms?: ('sha256' | 'sha384' | 'sha512')[];
    integrity?: string;
    size?: number;
  }

  interface WPUSOptions {
    headers?: HeaderFile | HeaderProvider | HeaderObject;

    /**
     * Output *.meta.js files or not.
     * Defaults to true.
     */
    metajs?: boolean;

    /**
     * Rename all .js files to .user.js files or not.
     * Defaults to true.
     */
    renameExt?: boolean;

    /**
     * Prettify the header or not.
     * Defaults to true.
     */
    pretty?: boolean;

    /**
     * Base URL for downloadURL.
     * If not provided, it will be set to `updateBaseUrl` if `updateBaseUrl` is provided.
     */
    downloadBaseUrl?: string;

    /**
     * Base URL for updateURL.
     * If not provided, it will be set to `downloadBaseUrl` if `downloadBaseUrl` is provided.
     */
    updateBaseUrl?: string;

    /**
     * Looks similar to `*.meta.js` but with additional `@require` meta field to include the main userscript.
     * It can be useful if you set TamperMonkey not to cache external files.
     */
    proxyScript?: ProxyScriptOptions;

    /**
     * Defaults to false.
     */
    ssri?: boolean | SsriOptions;
  }

  type HeaderFile = string;

  type HeaderProvider = (data: DataObject) => HeaderObject;

  interface HeaderObject {
    name?: string;

    namespace?: string;

    version?: string;

    author?: string;

    description?: string;

    homepage?: string;
    homepageURL?: string;
    website?: string;
    source?: string;

    icon?: string;
    iconURL?: string;
    defaulticon?: string;

    icon64?: string;
    icon64URL?: string;

    updateURL?: string;

    downloadURL?: string | 'none';
    installURL?: string;

    supportURL?: string;

    include?: string | string[];

    match?: string | string[];

    exclude?: string | string[];

    require?: string | string[];

    resource?: string | string[];

    connect?: string | string[];

    'run-at'?: 'document-start' | 'document-body' | 'document-end' | 'document-idle' | 'context-menu';

    grant?: string | string[] | 'none';

    webRequest?: string;

    noframes?: boolean;

    unwrap?: boolean;

    nocompat?: boolean | string;

    [field: string]: string | string[] | boolean | undefined; // For any other field not listed above.;
  }

  interface DataObject {
    /**
     * Hash of Webpack compilation.
     */
    hash: string;

    /**
     * Webpack chunk hash.
     */
    chunkHash: string;

    /**
     * Webpack chunk name.
     */
    chunkName: string;

    /**
     * Entry file path, which may contain queries.
     */
    file: string;

    /**
     * Just like `file` but without queries.
     */
    filename: string;

    /**
     * Just like `filename` but without file extension, i.e. ".user.js" or ".js".
     */
    basename: string;

    /**
     * Query string.
     */
    query: string;

    /**
     * Build number.
     */
    buildNo: number;

    /**
     * The 13-digits number represents the time the script is built.
     */
    buildTime: number;

    /**
     * Info from package.json.
     */
    name: string;
    version: string;
    description: string;
    author: string;
    homepage: string;
    bugs: string; // URL
  }
}

declare class WebpackUserscript implements WebpackPluginInstance {
  constructor(options?: WebpackUserscript.WebpackUserscriptOptions);

  apply(compiler: Compiler): void;
}

export = WebpackUserscript;
