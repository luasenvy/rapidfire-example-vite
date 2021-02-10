const fs = require('fs')
const path = require('path')

const { createServer: createViteServer } = require('vite')

const {
  Interfaces: { Middleware },
} = require('@luasenvy/rapidfire')

class ViteMiddleware extends Middleware {
  constructor() {
    super()

    this.viteServer = null
  }

  async init() {
    this.viteServer = await createViteServer({ server: { middlewareMode: true } })

    this.pipelines.push({ pipe: this.viteServer.middlewares })
    this.pipelines.push({ pattern: '*', pipe: (req, res, next) => this.viteServerSideRender(req, res, next) })
  }

  async viteServerSideRender(req, res, next) {
    try {
      return next(
        new Error(
          'rapidfire-example-vite Is Not Implemented "entry-server.js". If You Want Finishing This Process, Please See "https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server" And "https://vitejs.dev/guide/ssr.html#example-projects"'
        )
      )

      const { originalUrl: url } = req

      // 1. Read index.html
      let template = fs.readFileSync(path.resolve(__dirname, '../vite/index.html'), 'utf-8')

      // 2. Apply vite HTML transforms. This injects the vite HMR client, and
      //    also applies HTML transforms from Vite plugins, e.g. global preambles
      //    from @vitejs/plugin-react-refresh
      template = await this.viteServer.transformIndexHtml(url, template)

      // 3. Load the server entry. this.viteServer.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.

      const { render } = await this.viteServer.ssrLoadModule('/src/entry-server.js')

      // 4. render the app HTML. This assumes entry-server.js's exported `render`
      //    function calls appropriate framework SSR APIs,
      //    e.g. ReacDOMServer.renderToString()
      const appHtml = await render(url)

      // 5. Inject the app-rendered HTML into the template.
      const html = template.replace(`<!--ssr-outlet-->`, appHtml)

      // 6. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (err) {
      // If an error is caught, let vite fix the stracktrace so it maps back to
      // your actual source code.
      this.viteServer.ssrFixStacktrace(err)
      next(err)
    }
  }
}
module.exports = ViteMiddleware
