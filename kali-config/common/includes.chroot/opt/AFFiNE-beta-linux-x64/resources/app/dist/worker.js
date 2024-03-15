"use strict";

// src/worker/plugin.ts
var import_node_path = require("node:path");
var import_node_worker_threads = require("node:worker_threads");

// node_modules/async-call-rpc/out/base.mjs
function _define_property(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
var CustomError = class extends Error {
  constructor(name, message, code, stack) {
    super(message);
    _define_property(this, "name", void 0);
    _define_property(this, "code", void 0);
    _define_property(this, "stack", void 0);
    this.name = name;
    this.code = code;
    this.stack = stack;
  }
};
var Err_Cannot_find_a_running_iterator_with_given_ID = {};
var Err_Only_string_can_be_the_RPC_method_name = {};
var Err_Cannot_call_method_starts_with_rpc_dot_directly = {};
var Err_Then_is_accessed_on_local_implementation_Please_explicitly_mark_if_it_is_thenable_in_the_options = {};
var Messages = [
  Err_Cannot_find_a_running_iterator_with_given_ID,
  Err_Only_string_can_be_the_RPC_method_name,
  Err_Cannot_call_method_starts_with_rpc_dot_directly,
  Err_Then_is_accessed_on_local_implementation_Please_explicitly_mark_if_it_is_thenable_in_the_options
];
var makeHostedMessage = (id, error) => {
  const n = Messages.indexOf(id);
  error.message += `Error ${n}: https://github.com/Jack-Works/async-call-rpc/wiki/Errors#` + n;
  return error;
};
var errors = {
  // @ts-expect-error
  __proto__: null,
  Error,
  EvalError,
  RangeError,
  ReferenceError,
  SyntaxError,
  TypeError,
  URIError
};
var DOMExceptionHeader = "DOMException:";
var RecoverError = (type, message, code, stack) => {
  try {
    const E = globalDOMException();
    if (type.startsWith(DOMExceptionHeader) && E) {
      const name = type.slice(DOMExceptionHeader.length);
      return new E(message, name);
    } else if (type in errors) {
      const e = new errors[type](message);
      e.stack = stack;
      e.code = code;
      return e;
    } else {
      return new CustomError(type, message, code, stack);
    }
  } catch (e) {
    return new Error(`E${code} ${type}: ${message}
${stack}`);
  }
};
var removeStackHeader = (stack) => String(stack).replace(/^.+\n.+\n/, "");
var globalDOMException = () => {
  try {
    return DOMException;
  } catch (e) {
  }
};
var isString = (x) => typeof x === "string";
var isBoolean = (x) => typeof x === "boolean";
var isFunction = (x) => typeof x === "function";
var isObject = (params) => typeof params === "object" && params !== null;
var ERROR = "Error";
var undefined$1 = void 0;
var Promise_resolve = (x) => Promise.resolve(x);
var isArray = Array.isArray;
var replayFunction = () => "() => replay()";
var jsonrpc = "2.0";
var Request = (id, method, params, remoteStack) => {
  const x = {
    jsonrpc,
    id,
    method,
    params,
    remoteStack
  };
  deleteUndefined(x, "id");
  deleteFalsy(x, "remoteStack");
  return x;
};
var SuccessResponse = (id, result) => {
  const x = {
    jsonrpc,
    id,
    result
  };
  deleteUndefined(x, "id");
  return x;
};
var ErrorResponse = (id, code, message, data) => {
  if (id === undefined$1)
    id = null;
  code = Math.floor(code);
  if (Number.isNaN(code))
    code = -1;
  const x = {
    jsonrpc,
    id,
    error: {
      code,
      message,
      data
    }
  };
  deleteUndefined(x.error, "data");
  return x;
};
var ErrorResponseParseError = (e, mapper) => {
  const obj = ErrorResponseMapped({}, e, mapper);
  const o = obj.error;
  o.code = -32700;
  o.message = "Parse error";
  return obj;
};
var ErrorResponseInvalidRequest = (id) => ErrorResponse(id, -32600, "Invalid Request");
var ErrorResponseMethodNotFound = (id) => ErrorResponse(id, -32601, "Method not found");
var ErrorResponseMapped = (request, e, mapper) => {
  const { id } = request;
  const { code, message, data } = mapper(e, request);
  return ErrorResponse(id, code, message, data);
};
var defaultErrorMapper = (stack = "", code = -1) => (e) => {
  let message = toString("", () => e.message);
  let type = toString(ERROR, (ctor = e.constructor) => isFunction(ctor) && ctor.name);
  const E = globalDOMException();
  if (E && e instanceof E)
    type = DOMExceptionHeader + e.name;
  if (isString(e) || typeof e === "number" || isBoolean(e) || typeof e === "bigint") {
    type = ERROR;
    message = String(e);
  }
  const data = stack ? {
    stack,
    type
  } : {
    type
  };
  return {
    code,
    message,
    data
  };
};
var isJSONRPCObject = (data) => {
  if (!isObject(data))
    return false;
  if (!("jsonrpc" in data))
    return false;
  if (data.jsonrpc !== jsonrpc)
    return false;
  if ("params" in data) {
    const params = data.params;
    if (!isArray(params) && !isObject(params))
      return false;
  }
  return true;
};
var toString = (_default, val) => {
  try {
    const v = val();
    if (v === undefined$1)
      return _default;
    return String(v);
  } catch (e) {
    return _default;
  }
};
var deleteUndefined = (x, key) => {
  if (x[key] === undefined$1)
    delete x[key];
};
var deleteFalsy = (x, key) => {
  if (!x[key])
    delete x[key];
};
var i = "AsyncCall/";
var AsyncCallIgnoreResponse = Symbol.for(i + "ignored");
var AsyncCallNotify = Symbol.for(i + "notify");
var AsyncCallBatch = Symbol.for(i + "batch");
var generateRandomID = () => Math.random().toString(36).slice(2);
var undefinedToTrue = (x) => x === void 0 ? true : x;
var normalizeLogOptions = (log) => {
  if (log === "all")
    return [
      true,
      true,
      true,
      true,
      true,
      true
    ];
  if (!isBoolean(log)) {
    const { beCalled, localError, remoteError, type, requestReplay, sendLocalStack } = log;
    return [
      undefinedToTrue(beCalled),
      undefinedToTrue(localError),
      undefinedToTrue(remoteError),
      type !== "basic",
      requestReplay,
      sendLocalStack
    ];
  }
  if (log)
    return [
      true,
      true,
      true,
      true
    ];
  return [];
};
var normalizeStrictOptions = (strict) => {
  if (!isBoolean(strict)) {
    const { methodNotFound, unknownMessage } = strict;
    return [
      methodNotFound,
      unknownMessage
    ];
  }
  return [
    strict,
    strict
  ];
};
function AsyncCall(thisSideImplementation, options) {
  let isThisSideImplementationPending = true;
  let resolvedThisSideImplementationValue;
  let rejectedThisSideImplementation;
  let resolvedChannel;
  let channelPromise;
  const awaitThisSideImplementation = async () => {
    try {
      resolvedThisSideImplementationValue = await thisSideImplementation;
    } catch (e) {
      rejectedThisSideImplementation = e;
      console_error("AsyncCall failed to start", e);
    } finally {
      isThisSideImplementationPending = false;
    }
  };
  const onChannelResolved = (channel2) => {
    resolvedChannel = channel2;
    if (isCallbackBasedChannel(channel2)) {
      channel2.setup((data) => rawMessageReceiver(data).then(rawMessageSender), (data) => {
        const _ = deserialization(data);
        if (isJSONRPCObject(_))
          return true;
        return Promise_resolve(_).then(isJSONRPCObject);
      });
    }
    if (isEventBasedChannel(channel2)) {
      const m = channel2;
      m.on && m.on((_) => rawMessageReceiver(_).then(rawMessageSender).then((x) => x && m.send(x)));
    }
    return channel2;
  };
  const { serializer, key: logKey = "rpc", strict = true, log = true, parameterStructures = "by-position", preferLocalImplementation = false, idGenerator = generateRandomID, mapError, logger, channel, thenable } = options;
  if (thisSideImplementation instanceof Promise)
    awaitThisSideImplementation();
  else {
    resolvedThisSideImplementationValue = thisSideImplementation;
    isThisSideImplementationPending = false;
  }
  const [banMethodNotFound, banUnknownMessage] = normalizeStrictOptions(strict);
  const [log_beCalled, log_localError, log_remoteError, log_pretty, log_requestReplay, log_sendLocalStack] = normalizeLogOptions(log);
  const { log: console_log, error: console_error = console_log, debug: console_debug = console_log, groupCollapsed: console_groupCollapsed = console_log, groupEnd: console_groupEnd = console_log, warn: console_warn = console_log } = logger || console;
  const requestContext = /* @__PURE__ */ new Map();
  const onRequest = async (data) => {
    if (isThisSideImplementationPending)
      await awaitThisSideImplementation();
    else {
      if (rejectedThisSideImplementation)
        return makeErrorObject(rejectedThisSideImplementation, "", data);
    }
    let frameworkStack = "";
    try {
      const { params, method, id: req_id, remoteStack } = data;
      const key = method.startsWith("rpc.") ? Symbol.for(method) : method;
      const executor = resolvedThisSideImplementationValue && resolvedThisSideImplementationValue[key];
      if (!isFunction(executor)) {
        if (!banMethodNotFound) {
          if (log_localError)
            console_debug("Missing method", key, data);
          return;
        } else
          return ErrorResponseMethodNotFound(req_id);
      }
      const args = isArray(params) ? params : [
        params
      ];
      frameworkStack = removeStackHeader(new Error().stack);
      const promise = new Promise((resolve2) => resolve2(executor.apply(resolvedThisSideImplementationValue, args)));
      if (log_beCalled) {
        if (log_pretty) {
          const logArgs = [
            `${logKey}.%c${method}%c(${args.map(() => "%o").join(", ")}%c)
%o %c@${req_id}`,
            "color: #d2c057",
            "",
            ...args,
            "",
            promise,
            "color: gray; font-style: italic;"
          ];
          if (log_requestReplay) {
            const replay = () => {
              debugger;
              return executor.apply(resolvedThisSideImplementationValue, args);
            };
            replay.toString = replayFunction;
            logArgs.push(replay);
          }
          if (remoteStack) {
            console_groupCollapsed(...logArgs);
            console_log(remoteStack);
            console_groupEnd();
          } else
            console_log(...logArgs);
        } else
          console_log(`${logKey}.${method}(${[
            ...args
          ].toString()}) @${req_id}`);
      }
      const result = await promise;
      if (result === AsyncCallIgnoreResponse)
        return;
      return SuccessResponse(req_id, result);
    } catch (e) {
      return makeErrorObject(e, frameworkStack, data);
    }
  };
  const onResponse = async (data) => {
    let errorMessage = "", remoteErrorStack = "", errorCode = 0, errorType = ERROR;
    if ("error" in data) {
      const e = data.error;
      errorMessage = e.message;
      errorCode = e.code;
      const detail = e.data;
      if (isObject(detail) && "stack" in detail && isString(detail.stack))
        remoteErrorStack = detail.stack;
      else
        remoteErrorStack = "<remote stack not available>";
      if (isObject(detail) && "type" in detail && isString(detail.type))
        errorType = detail.type;
      else
        errorType = ERROR;
      if (log_remoteError)
        log_pretty ? console_error(`${errorType}: ${errorMessage}(${errorCode}) %c@${data.id}
%c${remoteErrorStack}`, "color: gray", "") : console_error(`${errorType}: ${errorMessage}(${errorCode}) @${data.id}
${remoteErrorStack}`);
    }
    const { id } = data;
    if (id === null || id === undefined$1 || !requestContext.has(id))
      return;
    const [resolve2, reject, localErrorStack = ""] = requestContext.get(id);
    requestContext.delete(id);
    if ("error" in data) {
      reject(RecoverError(
        errorType,
        errorMessage,
        errorCode,
        // ? We use \u0430 which looks like "a" to prevent browser think "at AsyncCall" is a real stack
        remoteErrorStack + "\n    \u0430t AsyncCall (rpc) \n" + localErrorStack
      ));
    } else {
      resolve2(data.result);
    }
    return;
  };
  const rawMessageReceiver = async (_) => {
    let data;
    let result = undefined$1;
    try {
      data = await deserialization(_);
      if (isJSONRPCObject(data)) {
        return result = await handleSingleMessage(data);
      } else if (isArray(data) && data.every(isJSONRPCObject) && data.length !== 0) {
        return Promise.all(data.map(handleSingleMessage));
      } else {
        if (banUnknownMessage) {
          let id = data.id;
          if (id === undefined$1)
            id = null;
          return ErrorResponseInvalidRequest(id);
        } else {
          return undefined$1;
        }
      }
    } catch (e) {
      if (log_localError)
        console_error(e, data, result);
      return ErrorResponseParseError(e, mapError || defaultErrorMapper(e && e.stack));
    }
  };
  const rawMessageSender = async (res) => {
    if (!res)
      return;
    if (isArray(res)) {
      const reply = res.filter((x) => x && "id" in x);
      if (reply.length === 0)
        return;
      return serialization(reply);
    } else {
      return serialization(res);
    }
  };
  const serialization = serializer ? (x) => serializer.serialization(x) : Object;
  const deserialization = serializer ? (x) => serializer.deserialization(x) : Object;
  if (channel instanceof Promise)
    channelPromise = channel.then(onChannelResolved);
  else
    onChannelResolved(channel);
  const makeErrorObject = (e, frameworkStack, data) => {
    if (isObject(e) && "stack" in e)
      e.stack = frameworkStack.split("\n").reduce((stack, fstack) => stack.replace(fstack + "\n", ""), "" + e.stack);
    if (log_localError)
      console_error(e);
    return ErrorResponseMapped(data, e, mapError || defaultErrorMapper(log_sendLocalStack ? e.stack : undefined$1));
  };
  const sendPayload = async (payload, removeQueueR = false) => {
    if (removeQueueR)
      payload = [
        ...payload
      ];
    const data = await serialization(payload);
    return (resolvedChannel || await channelPromise).send(data);
  };
  const rejectsQueue = (queue, error) => {
    for (const x of queue) {
      if ("id" in x) {
        const ctx = requestContext.get(x.id);
        ctx && ctx[1](error);
      }
    }
  };
  const handleSingleMessage = async (data) => {
    if ("method" in data) {
      const r = onRequest(data);
      if ("id" in data)
        return r;
      try {
        await r;
      } catch (e) {
      }
      return undefined$1;
    }
    return onResponse(data);
  };
  const call = (method, args, stack, notify = false) => {
    return new Promise((resolve2, reject) => {
      let queue = undefined$1;
      if (method === AsyncCallBatch) {
        queue = args.shift();
        method = args.shift();
      }
      if (typeof method === "symbol") {
        const RPCInternalMethod = Symbol.keyFor(method) || method.description;
        if (RPCInternalMethod) {
          if (RPCInternalMethod.startsWith("rpc."))
            method = RPCInternalMethod;
          else
            throw new TypeError("Not start with rpc.");
        }
      } else if (method.startsWith("rpc.")) {
        throw makeHostedMessage(Err_Cannot_call_method_starts_with_rpc_dot_directly, new TypeError());
      }
      if (preferLocalImplementation && !isThisSideImplementationPending && isString(method)) {
        const localImpl = resolvedThisSideImplementationValue && resolvedThisSideImplementationValue[method];
        if (isFunction(localImpl))
          return resolve2(localImpl(...args));
      }
      const id = idGenerator();
      stack = removeStackHeader(stack);
      const param = parameterStructures === "by-name" && args.length === 1 && isObject(args[0]) ? args[0] : args;
      const request = Request(notify ? undefined$1 : id, method, param, log_sendLocalStack ? stack : undefined$1);
      if (queue) {
        queue.push(request);
        if (!queue.r)
          queue.r = [
            () => sendPayload(queue, true),
            (e) => rejectsQueue(queue, e)
          ];
      } else
        sendPayload(request).catch(reject);
      if (notify)
        return resolve2();
      requestContext.set(id, [
        resolve2,
        reject,
        stack
      ]);
    });
  };
  const getTrap = (_, method) => {
    const f = {
      // This function will be logged to the console so it must be 1 line
      [method]: (..._2) => call(method, _2, new Error().stack)
    }[method];
    const f2 = {
      [method]: (..._2) => call(method, _2, new Error().stack, true)
    }[method];
    f[AsyncCallNotify] = f2[AsyncCallNotify] = f2;
    isString(method) && Object.defineProperty(methodContainer, method, {
      value: f,
      configurable: true
    });
    return f;
  };
  const methodContainer = {
    __proto__: new Proxy({}, {
      get: getTrap
    })
  };
  if (thenable === false)
    methodContainer.then = undefined$1;
  else if (thenable === undefined$1) {
    Object.defineProperty(methodContainer, "then", {
      configurable: true,
      get() {
        console_warn(makeHostedMessage(Err_Then_is_accessed_on_local_implementation_Please_explicitly_mark_if_it_is_thenable_in_the_options, new TypeError("RPC used as Promise: ")));
      }
    });
  }
  return new Proxy(methodContainer, {
    getPrototypeOf: () => null,
    setPrototypeOf: (_, value) => value === null,
    // some library will treat this object as a normal object and run algorithm steps in https://tc39.es/ecma262/#sec-ordinaryget
    getOwnPropertyDescriptor(_, method) {
      if (!(method in methodContainer))
        getTrap(_, method);
      return Object.getOwnPropertyDescriptor(methodContainer, method);
    }
  });
}
var isEventBasedChannel = (x) => "send" in x && isFunction(x.send);
var isCallbackBasedChannel = (x) => "setup" in x && isFunction(x.setup);

// src/shared/utils.ts
var MessageEventChannel = class {
  constructor(worker) {
    this.worker = worker;
  }
  on(listener) {
    const f = (data) => {
      listener(data);
    };
    this.worker.addListener("message", f);
    return () => {
      this.worker.removeListener("message", f);
    };
  }
  send(data) {
    this.worker.postMessage(data);
  }
};

// src/worker/plugin.ts
if (!import_node_worker_threads.parentPort) {
  throw new Error("parentPort is null");
}
var commandProxy = {};
import_node_worker_threads.parentPort.start();
var mainThread = AsyncCall(commandProxy, {
  channel: new MessageEventChannel(import_node_worker_threads.parentPort)
});
globalThis.console.log = mainThread.log;
globalThis.console.error = mainThread.log;
globalThis.console.info = mainThread.log;
globalThis.console.debug = mainThread.log;
globalThis.console.warn = mainThread.log;
var bookmarkPluginModule = require((0, import_node_path.join)(
  process.env.PLUGIN_DIR ?? (0, import_node_path.resolve)(__dirname, "./plugins"),
  "./bookmark/index.cjs"
));
var serverContext = {
  registerCommand: (command, fn) => {
    console.log("register command", command);
    commandProxy[command] = fn;
  },
  unregisterCommand: (command) => {
    console.log("unregister command", command);
    delete commandProxy[command];
  }
};
bookmarkPluginModule.entry(serverContext);
