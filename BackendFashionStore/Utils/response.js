
const env = require("../config/env");

const ok = (res, payload) => res.status(200).json(payload);

const created = (res, payload) => res.status(201).json(payload);

const message = (res, text, extra = {}) =>
  res.status(200).json({ message: text, ...extra });

const noContent = (res) => res.status(204).end();

const list = (res, data, { total, page, limit } = {}) => {
  const count = Number.isFinite(total) ? total : data.length;
  const body = { total: count, data: data };

  if (page && limit) {
    body.page = page;
    body.limit = limit;
    body.pages = Math.max(1, Math.ceil(count / limit));
    body.hasMore = page * limit < count;
  }

  return res.status(200).json(body);
};

const fail = (res, statusCode, text, { code, stack } = {}) =>
  res.status(statusCode).json({
    success: false,
    message: text,
    ...(code && { code: code }),
    ...(!env.isProduction && stack && { stack: stack }),
  });

module.exports = { ok, created, message, noContent, list, fail };
