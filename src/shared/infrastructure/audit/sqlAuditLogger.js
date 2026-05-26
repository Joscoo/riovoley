import { createClient } from '@supabase/supabase-js';

const MAX_SQL_TEXT_LENGTH = 1200;
const MAX_DETAILS_LENGTH = 6000;

const AUDITED_TABLE_MUTATIONS = new Set(['insert', 'update', 'upsert', 'delete']);
const AUDITED_AUTH_METHODS = new Set([
  'signInWithPassword',
  'signOut',
  'resetPasswordForEmail',
  'exchangeCodeForSession',
  'setSession',
  'updateUser',
]);

const AUDITED_FUNCTION_METHODS = new Set(['invoke']);

const REDACTED_KEYS = new Set([
  'password',
  'new_password',
  'token',
  'access_token',
  'refresh_token',
  'client_secret',
  'secret',
  'authorization',
]);

const isObject = (value) => value !== null && typeof value === 'object';
const isThenable = (value) => Boolean(value) && typeof value.then === 'function';

const generateRequestId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const truncate = (value, maxLength) => {
  const text = String(value ?? '');
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({ serialization_error: error?.message || 'unknown' });
  }
};

const sanitizeValue = (value, level = 0) => {
  if (level > 4) return '[truncated_depth]';
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, level + 1));
  if (!isObject(value)) return value;

  const sanitized = {};
  Object.entries(value).forEach(([key, nested]) => {
    const normalizedKey = String(key).toLowerCase();
    if (REDACTED_KEYS.has(normalizedKey)) {
      sanitized[key] = '[redacted]';
      return;
    }
    sanitized[key] = sanitizeValue(nested, level + 1);
  });
  return sanitized;
};

const buildSqlText = (context) => {
  if (context.source === 'table') {
    return truncate(`${String(context.operation || '').toUpperCase()} ${context.table}`, MAX_SQL_TEXT_LENGTH);
  }
  if (context.source === 'rpc') {
    return truncate(`RPC ${context.rpcName}`, MAX_SQL_TEXT_LENGTH);
  }
  if (context.source === 'auth') {
    return truncate(`AUTH ${context.authMethod}`, MAX_SQL_TEXT_LENGTH);
  }
  if (context.source === 'function') {
    return truncate(`FUNCTION ${context.functionName}`, MAX_SQL_TEXT_LENGTH);
  }
  return truncate(context.description || 'UNKNOWN_OPERATION', MAX_SQL_TEXT_LENGTH);
};

const buildDescription = (context) => {
  if (context.source === 'table') return `Mutation ${context.operation} on ${context.table}`;
  if (context.source === 'rpc') return `RPC ${context.rpcName}`;
  if (context.source === 'auth') return `Auth action ${context.authMethod}`;
  if (context.source === 'function') return `Edge function ${context.functionName}`;
  return context.description || 'Operation';
};

const buildDetails = (context, extra = {}) => {
  const payload = {
    source: context.source,
    table: context.table || null,
    operation: context.operation || null,
    rpcName: context.rpcName || null,
    authMethod: context.authMethod || null,
    functionName: context.functionName || null,
    args: sanitizeValue(context.args),
    payload: sanitizeValue(context.payload),
    ...sanitizeValue(extra),
  };

  const json = truncate(safeStringify(payload), MAX_DETAILS_LENGTH);
  try {
    return JSON.parse(json);
  } catch (error) {
    return { source: context.source, parse_error: error?.message || 'invalid_json' };
  }
};

const buildErrorInfo = (errorLike) => {
  if (!errorLike) return { code: null, message: 'Unknown error' };
  if (typeof errorLike === 'string') return { code: null, message: errorLike };

  return {
    code: errorLike.code || errorLike.status || null,
    message: errorLike.message || safeStringify(errorLike),
  };
};

export const createSqlAuditLogger = ({ supabaseUrl, supabaseAnonKey, baseClient = null }) => {
  const auditClient = (baseClient || createClient(supabaseUrl, supabaseAnonKey)).schema('audit');

  const logExecution = async (context, details = {}) => {
    const payload = {
      description: buildDescription(context),
      sql_text: buildSqlText(context),
      status: 'success',
      request_id: context.requestId || generateRequestId(),
      details: buildDetails(context, details),
    };

    const { error } = await auditClient.from('sql_executions').insert(payload);
    if (error) {
      // Avoid throwing: audit failures must not break app actions.
      console.warn('Audit log execution failed:', error.message || error);
    }
  };

  const logError = async (context, errorLike, details = {}) => {
    const normalizedError = buildErrorInfo(errorLike);
    const payload = {
      description: buildDescription(context),
      sql_text: buildSqlText(context),
      error_code: normalizedError.code,
      error_message: truncate(normalizedError.message, 1000),
      status: 'error',
      request_id: context.requestId || generateRequestId(),
      details: buildDetails(context, details),
    };

    const { error } = await auditClient.from('sql_errors').insert(payload);
    if (error) {
      console.warn('Audit log error failed:', error.message || error);
    }
  };

  const queueExecutionLog = (context, details = {}) => {
    void logExecution(context, details);
  };

  const queueErrorLog = (context, errorLike, details = {}) => {
    void logError(context, errorLike, details);
  };

  const wrapThenableWithAudit = (thenable, context) => {
    if (!context?.shouldAudit) return thenable;

    let logged = false;
    const markLogged = () => {
      if (logged) return false;
      logged = true;
      return true;
    };

    return new Proxy(thenable, {
      get(target, prop, receiver) {
        if (prop === 'then') {
          return (onFulfilled, onRejected) =>
            target.then(
              (value) => {
                if (markLogged()) {
                  if (value?.error) {
                    queueErrorLog(context, value.error, { result: value });
                  } else {
                    queueExecutionLog(context, { result: value });
                  }
                }
                return onFulfilled ? onFulfilled(value) : value;
              },
              (error) => {
                if (markLogged()) {
                  queueErrorLog(context, error);
                }
                if (onRejected) return onRejected(error);
                throw error;
              }
            );
        }

        if (prop === 'catch') {
          return (onRejected) =>
            target.catch((error) => {
              if (markLogged()) {
                queueErrorLog(context, error);
              }
              if (onRejected) return onRejected(error);
              throw error;
            });
        }

        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') return value;

        return (...args) => {
          const output = value.apply(target, args);
          if (!output || typeof output !== 'object') return output;
          return wrapQueryBuilder(output, context);
        };
      },
    });
  };

  const wrapQueryBuilder = (builder, baseContext) => new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        const resolvedPromise = Promise.resolve(target);
        const auditedPromise = baseContext?.shouldAudit
          ? wrapThenableWithAudit(resolvedPromise, baseContext)
          : resolvedPromise;
        const method = Reflect.get(auditedPromise, prop);
        return typeof method === 'function' ? method.bind(auditedPromise) : method;
      }

      if (typeof value !== 'function') return value;

      return (...args) => {
        const output = value.apply(target, args);
        if (!output || typeof output !== 'object') return output;

        let nextContext = baseContext;
        if (AUDITED_TABLE_MUTATIONS.has(String(prop))) {
          nextContext = {
            ...baseContext,
            operation: String(prop),
            payload: args[0],
            requestId: baseContext.requestId || generateRequestId(),
            shouldAudit: true,
          };
        }

        return wrapQueryBuilder(output, nextContext);
      };
    },
  });

  const wrapAuthClient = (authClient) => new Proxy(authClient, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;

      return (...args) => {
        const output = value.apply(target, args);
        if (!AUDITED_AUTH_METHODS.has(String(prop)) || !isThenable(output)) {
          return output;
        }

        const context = {
          source: 'auth',
          authMethod: String(prop),
          args,
          requestId: generateRequestId(),
          shouldAudit: true,
        };

        return wrapThenableWithAudit(output, context);
      };
    },
  });

  const wrapFunctionsClient = (functionsClient) => new Proxy(functionsClient, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;

      return (...args) => {
        const output = value.apply(target, args);
        if (!AUDITED_FUNCTION_METHODS.has(String(prop)) || !isThenable(output)) {
          return output;
        }

        const context = {
          source: 'function',
          functionName: args[0],
          args: args.slice(1),
          requestId: generateRequestId(),
          shouldAudit: true,
        };

        return wrapThenableWithAudit(output, context);
      };
    },
  });

  const createAuditedClient = (baseClient) => new Proxy(baseClient, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return (table) => wrapQueryBuilder(target.from(table), {
          source: 'table',
          table,
          requestId: generateRequestId(),
          shouldAudit: false,
        });
      }

      if (prop === 'rpc') {
        return (rpcName, payload, options) =>
          wrapThenableWithAudit(
            target.rpc(rpcName, payload, options),
            {
              source: 'rpc',
              rpcName,
              operation: 'rpc',
              payload,
              args: [options].filter(Boolean),
              requestId: generateRequestId(),
              shouldAudit: true,
            }
          );
      }

      if (prop === 'schema') {
        return (schemaName) => createAuditedClient(target.schema(schemaName));
      }

      if (prop === 'auth') {
        return wrapAuthClient(target.auth);
      }

      if (prop === 'functions') {
        return wrapFunctionsClient(target.functions);
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') return value.bind(target);
      return value;
    },
  });

  return {
    createAuditedClient,
    logExecution: queueExecutionLog,
    logError: queueErrorLog,
  };
};
