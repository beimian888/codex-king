(function () {
  var nativeFunction = window.Function;
  var nativeEval = window.eval;
  var nativeSetTimeout = window.setTimeout;
  var nativeSetInterval = window.setInterval;

  function sanitizeDebugSource(value) {
    if (typeof value !== "string") return value;
    return value.replace(/\bdebugger\s*;?/g, "void 0;");
  }

  function sanitizeArgs(args) {
    return Array.prototype.map.call(args, sanitizeDebugSource);
  }

  function SafeFunction() {
    return nativeFunction.apply(this, sanitizeArgs(arguments));
  }

  try {
    Object.setPrototypeOf(SafeFunction, nativeFunction);
    SafeFunction.prototype = nativeFunction.prototype;
    Object.defineProperty(window, "Function", {
      configurable: true,
      writable: true,
      value: SafeFunction,
    });
    Object.defineProperty(nativeFunction.prototype, "constructor", {
      configurable: true,
      writable: true,
      value: SafeFunction,
    });
  } catch (error) {
    window.Function = SafeFunction;
  }

  window.eval = function (source) {
    return nativeEval.call(this, sanitizeDebugSource(source));
  };

  window.setTimeout = function (handler) {
    if (typeof handler === "string") {
      arguments[0] = sanitizeDebugSource(handler);
    }
    return nativeSetTimeout.apply(this, arguments);
  };

  window.setInterval = function (handler) {
    if (typeof handler === "string") {
      arguments[0] = sanitizeDebugSource(handler);
    }
    return nativeSetInterval.apply(this, arguments);
  };
})();
