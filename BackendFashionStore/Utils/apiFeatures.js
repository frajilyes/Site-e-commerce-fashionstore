
const env = require("../config/env");

const RESERVED = ["keyword", "search", "q", "page", "limit", "sort", "fields"];

const OPERATORS = ["gt", "gte", "lt", "lte", "ne", "in", "nin"];

const parseOperatorKey = (key) => {
  const bracket = /^([\w.]+)\[(\w+)\]$/.exec(key);
  if (bracket) return { field: bracket[1], operator: bracket[2] };

  const dotted = /^([\w]+)\.(\w+)$/.exec(key);
  if (dotted && OPERATORS.includes(dotted[2])) {
    return { field: dotted[1], operator: dotted[2] };
  }

  return { field: key, operator: null };
};

const coerce = (value, operator) => {
  if (Array.isArray(value)) return value;
  if (operator === "in" || operator === "nin") {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const text = String(value).trim();
  if (text === "true") return true;
  if (text === "false") return false;
  if (text !== "" && !Number.isNaN(Number(text))) return Number(text);
  return text;
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const safeFieldList = (value, pattern, max = 20) =>
  String(Array.isArray(value) ? value[0] : value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => pattern.test(item) && item !== "password")
    .slice(0, max)
    .join(" ");

const hasTextIndex = (model) =>
  model.schema
    .indexes()
    .some(([definition]) =>
      Object.values(definition).some((type) => type === "text"),
    );

class ApiFeatures {
  constructor(query, queryString = {}) {
    this.query = query;
    this.queryString = queryString || {};
    this.page = null;
    this.limit = null;
  }

  searchText(fields = []) {
    const { keyword, search, q } = this.queryString;
    const term = String(keyword || search || q || "").trim().slice(0, 100);
    if (!term) return this;

    if (hasTextIndex(this.query.model)) {
      this.query = this.query.find({ $text: { $search: term } });
      return this;
    }

    if (fields.length) {
      const pattern = new RegExp(escapeRegex(term), "i");
      this.query = this.query.find({
        $or: fields.map((field) => ({ [field]: pattern })),
      });
    }

    return this;
  }

  filter(allowedFields = []) {
    const allowed = new Set(allowedFields);
    const conditions = {};

    Object.entries(this.queryString).forEach(([key, value]) => {
      if (RESERVED.includes(key) || value === undefined || value === "") return;

      const { field, operator } = parseOperatorKey(key);
      if (!allowed.has(field)) return;

      if (operator && OPERATORS.includes(operator)) {
        conditions[field] = {
          ...conditions[field],
          [`$${operator}`]: coerce(value, operator),
        };
        return;
      }

      if (value !== null && typeof value === "object") return;

      conditions[field] = coerce(value, null);
    });

    if (Object.keys(conditions).length) {
      this.query = this.query.find(conditions);
    }

    return this;
  }

  sort(defaultSort = "-createdAt") {
    const requested = safeFieldList(this.queryString.sort, /^-?[A-Za-z_]\w*$/);
    this.query = this.query.sort(requested || defaultSort);
    return this;
  }

  selectFields(defaultFields = "-__v") {
    const requested = safeFieldList(this.queryString.fields, /^-?[A-Za-z_]\w*$/);
    this.query = this.query.select(requested || defaultFields);
    return this;
  }

  paginate() {
    const { page, limit } = this.queryString;
    if (page === undefined && limit === undefined) return this;

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const perPage = Math.min(
      env.pagination.maxLimit,
      Math.max(1, Number.parseInt(limit, 10) || env.pagination.defaultLimit),
    );

    this.page = currentPage;
    this.limit = perPage;
    this.query = this.query.skip((currentPage - 1) * perPage).limit(perPage);

    return this;
  }

  async execute() {
    if (this.limit === null) {
      const data = await this.query.lean().exec();
      return { data: data, total: data.length, page: null, limit: null };
    }

    const filter = this.query.getFilter();
    const [data, total] = await Promise.all([
      this.query.lean().exec(),
      this.query.model.countDocuments(filter),
    ]);

    return { data: data, total: total, page: this.page, limit: this.limit };
  }
}

module.exports = ApiFeatures;
module.exports.escapeRegex = escapeRegex;
