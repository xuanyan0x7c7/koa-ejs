const path = require("path");
const ejs = require("ejs");
const fs = require("co-fs");

const defaults = {
  root: "views",
  cache: true,
  layout: "layout",
  viewExt: "html",
  locals: {},
  debug: false
};

class Renderer {
  constructor(options) {
    this.settings = Object.assign({}, defaults, options);
    this.settings.viewExt = this.settings.viewExt ? "." + this.settings.viewExt : "";
    this.cache = Object.create(null);
  }

  * render(view, options) {
    let view_path = path.resolve(this.settings.root, view + this.settings.viewExt);

    let fn;
    if (this.settings.cache && this.cache[view_path]) {
      fn = this.cache[view_path];
    } else {
      let template = yield fs.readFile(view_path, "utf8");
      fn = ejs.compile(template, {
        filename: view_path,
        _with: this.settings._with,
        compileDebug: this.settings.debug,
        delimiter: this.settings.delimiter
      });
      if (this.settings.cache) {
        this.cache[view_path] = fn;
      }
    }

    return fn.call(options.scope, options);
  }

  middleware() {
    let that = this;

    return function*(next) {
      this.renderView = function*(view, context) {
        context = Object.assign({}, this.state, context);
        let html = yield* that.render(view, context);
        let layout = context.layout === false ? false : (context.layout || that.settings.layout);
        if (layout) {
          context.body = html;
          html = yield* that.render(layout, context);
        }
        return html;
      };

      this.render = function*(view, context) {
        let html = yield this.renderView(view, context);
        this.type = "html";
        this.body = html;
      };

      yield next;
    };
  }
}

exports = module.exports = Renderer;
exports.ejs = ejs;
