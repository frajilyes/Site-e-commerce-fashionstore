
const MAX_DEPTH = 8;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const FORBIDDEN_KEYS = ["__proto__", "constructor", "prototype"];

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isDangerousKey = (key) =>
  key.startsWith("$") || key.includes(".") || FORBIDDEN_KEYS.includes(key);

const cleanString = (value) => value.replace(CONTROL_CHARS, "").trim();

const cleanValue = (value, depth = 0) => {
  if (depth > MAX_DEPTH) return undefined;

  if (typeof value === "string") return cleanString(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => cleanValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const result = Object.create(null);
    let kept = 0;

    Object.keys(value).forEach((key) => {
      if (isDangerousKey(key)) return;
      const cleaned = cleanValue(value[key], depth + 1);
      if (cleaned === undefined) return;
      result[key] = cleaned;
      kept += 1;
    });

    return kept ? { ...result } : {};
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    req.body = cleanValue(req.body);
  }

  if (req.params && Object.keys(req.params).length) {
    req.params = cleanValue(req.params);
  }

  const query = req.query;
  if (query && Object.keys(query).length) {
    Object.defineProperty(req, "query", {
      value: cleanValue(query),
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  next();
};

const stripHtml = (value) => {
  if (typeof value !== "string") return value;
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

const stripHtmlFields = (...fields) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === "object") {
      fields.forEach((field) => {
        if (typeof req.body[field] === "string") {
          req.body[field] = stripHtml(req.body[field]);
        }
      });
    }
    next();
  };
};

module.exports = {
  sanitizeRequest,
  stripHtmlFields,
  stripHtml,
  cleanValue,
};
