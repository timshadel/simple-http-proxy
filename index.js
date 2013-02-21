
/**
 * Module dependencies
 */
var superagent = require("superagent");

// Don't let superagent serialize anything
superagent.serialize = {};

module.exports = function(endpoint, options) {
  if (!options) options = {};
  return function simpleHttpProxy(req, res, next) {
    var hostInfo = req.headers.host.split(":")
      , host = hostInfo[0]
      , port = hostInfo[1]
      , resPath = req.originalUrl.replace(req.url, "");

    // Remove the host header
    delete req.headers.host;

    // Optionally delete cookie
    if(!options.cookie) {
      delete req.headers.cookie;
    }

    // We'll need to add a / if it's not on there
    if(resPath.indexOf("/") === -1) resPath = "/"+resPath;

    // Send it through superagent
    var request = superagent(req.method, endpoint+req.url)
      .buffer(false)
      .set(req.headers);

    // Add the x-forwarded-* headers
    if(options.xforward) {
      request
        .set({
          "x-forwarded-proto": req.connection.encrypted ? "https" : "http",
          "x-forwarded-host": host,
          "x-forwarded-path": resPath
        });

      if (port) request.set("x-forwarded-port", port);
    }

    // Pipe upstream and downstream
    req.pipe(request);
    request.pipe(res);
  }
}