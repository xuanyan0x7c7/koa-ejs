const Renderer = require("./renderer");

exports = module.exports = options => new Renderer(options).middleware();
exports.Renderer = Renderer;
