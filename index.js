var nanoid = require("nanoid")

function defaultTemplate(notifyOpts) {
  return (
    '<div class="apicase-notify-title">' +
    notifyOpts.title +
    "</div>" +
    '<div class="apicase-notify-body">' +
    notifyOpts.body +
    "</div>"
  )
}

function createNotify(pluginOpts, notifyOpts) {
  if (!document || !document.querySelector) return
  var elem = document.createElement("div")
  elem.id = nanoid(5)
  elem.classList.add("apicase-notify")
  elem.innerHTML = (pluginOpts.template || defaultTemplate)(notifyOpts)
  elem.dataset["closeDelay"] = pluginOpts.closeDelay || 0
  document.querySelector(pluginOpts.el || "#apicase-notifies").appendChild(elem)
  return elem.id
}

function withNotify(notifyType, cb) {
  return function(ctx) {
    if (!ctx.meta.notify || !ctx.meta.notify.pending)
      return ctx.next(ctx.payload)
    var notifyData = ctx.meta.notify[notifyType](ctx)
    var notifyId = createNotify(opts, {
      type: notifyType,
      title: notifyData.title,
      body: notifyData.body
    })
    return cb(ctx, notifyId, notifyData)
  }
}

module.exports = function notifyPlugin(opts) {
  return function(service) {
    return service.extend({
      hooks: {
        before: withNotify("pending", function(ctx, id) {
          ctx.next(ctx.payload).then(() => {
            var el = document.getElementById(id)
            var remove = () => el.parentNode.removeChild(el)
            if (el) {
              if (+el.dataset["closeDelay"] === 0) remove()
              else {
                el.classList.add("apicase-notify-closing")
                setTimeout(remove, +el.dataset["closeDelay"])
              }
            }
          })
        }),
        done: withNotify("done", function(ctx) {
          return ctx.next(ctx.result)
        }),
        fail: withNotify("fail", function(ctx) {
          return ctx.next(ctx.result)
        })
      }
    })
  }
}
