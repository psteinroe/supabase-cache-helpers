"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  OPERATOR_MAP: () => OPERATOR_MAP,
  PostgrestFilterFnBuilder: () => PostgrestFilterFnBuilder,
  PostgrestQueryParser: () => PostgrestQueryParser,
  SUPPORTED_OPERATORS: () => SUPPORTED_OPERATORS,
  isISODateString: () => isISODateString,
  isNotNull: () => isNotNull,
  parseValue: () => parseValue
});
module.exports = __toCommonJS(src_exports);

// src/lib/operators.ts
var import_isequal = __toESM(require("lodash/isequal"));
var buildLikeRegex = (search) => new RegExp(`^${search.replace(/%/g, ".*")}$`);
var textSearch = (c, v) => {
  const regExp = `^${v.split("&").map((v2) => v2.trim().toLowerCase()).join("|").replace(/:\*/g, ".*")}$`;
  const tokens = c.match(/'(.*?)'/g).map((t) => t.replace(/'/g, "").toLowerCase());
  return tokens.some((t) => new RegExp(regExp).test(t));
};
var ifDateGetTime = (v) => v instanceof Date ? v.getTime() : v;
var OPERATOR_MAP = {
  eq: (c, v) => ifDateGetTime(c) === ifDateGetTime(v),
  neq: (c, v) => ifDateGetTime(c) !== ifDateGetTime(v),
  gt: (c, v) => c > v,
  gte: (c, v) => c >= v,
  lt: (c, v) => c < v,
  lte: (c, v) => c <= v,
  like: (c, v) => buildLikeRegex(v).test(c.toString()),
  ilike: (c, v) => buildLikeRegex(v.toLowerCase()).test(c.toString().toLowerCase()),
  is: (c, v) => c === v,
  in: (c, v) => {
    const parsedValue = v.slice(1, -1).split(",");
    return parsedValue.some((i) => i === c);
  },
  cs: (c, v) => {
    if (!Array.isArray(c))
      return false;
    if (!Array.isArray(v))
      v = v.slice(1, -1).split(",");
    return v.every((i) => c.some((colVal) => (0, import_isequal.default)(colVal, i)));
  },
  cd: (c, v) => {
    if (!Array.isArray(c))
      return false;
    if (!Array.isArray(v))
      v = v.slice(1, -1).split(",");
    return c.every((i) => v.some((cmpVal) => (0, import_isequal.default)(cmpVal, i)));
  },
  fts: textSearch,
  plfts: (c, v) => buildLikeRegex(v.toLowerCase()).test(c.toString().toLowerCase())
};
var SUPPORTED_OPERATORS = ["or", ...Object.keys(OPERATOR_MAP)];

// src/lib/utils.ts
var isISODateString = (v) => typeof v === "string" && /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/.test(
  v
);
var parseValue = (v) => {
  if (isISODateString(v))
    return new Date(v);
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};
var isNotNull = (i) => i !== null;

// src/builder.ts
var import_get = __toESM(require("lodash/get"));
var PostgrestFilterFnBuilder = class {
  constructor(query) {
    this.query = query;
  }
  get fn() {
    if (!this._fn) {
      this._fn = (obj) => this.filtersFn(obj) && this.selectFn(obj);
    }
    return this._fn;
  }
  get filtersFn() {
    if (!this._filtersFn) {
      const filterFns = this.query.filters.map((d) => this.buildFilterFn(d));
      this._filtersFn = (obj) => filterFns.every((fn) => fn(obj));
    }
    return this._filtersFn;
  }
  get selectFn() {
    if (!this._selectFn) {
      this._selectFn = (obj) => this.query.paths.every((p) => typeof (0, import_get.default)(obj, p) !== "undefined");
    }
    return this._selectFn;
  }
  applyFilterFn(obj, path, {
    filterFn,
    value,
    negate
  }) {
    const pathElements = path.split(".");
    const v = obj[pathElements[0]];
    if (typeof v === "undefined")
      return false;
    if (pathElements.length > 1) {
      if (Array.isArray(v)) {
        return v.some(
          (val) => this.applyFilterFn(val, pathElements.slice(1).join("."), {
            filterFn,
            value,
            negate
          })
        );
      }
      return this.applyFilterFn(
        v,
        pathElements.slice(1).join("."),
        {
          filterFn,
          value,
          negate
        }
      );
    }
    const res = filterFn(parseValue(v), value);
    if (negate)
      return !res;
    return res;
  }
  buildFilterFn(def) {
    if ("or" in def) {
      return (obj) => def.or.some((d) => this.buildFilterFn(d)(obj));
    }
    if ("and" in def) {
      return (obj) => def.and.every((d) => this.buildFilterFn(d)(obj));
    }
    const { operator, path, value, negate } = def;
    const filterFn = OPERATOR_MAP[operator];
    if (!filterFn)
      throw new Error(`Operator ${operator} is not supported`);
    return (obj) => this.applyFilterFn(obj, path, { filterFn, value, negate });
  }
};

// src/parser.ts
var import_xregexp = __toESM(require("xregexp"));
var PostgrestQueryParser = class {
  constructor(params, opts) {
    this.params = params;
    this.opts = opts;
  }
  get builder() {
    return new PostgrestFilterFnBuilder({
      filters: this.filters,
      paths: this.paths
    });
  }
  get paths() {
    if (!this._paths) {
      this._paths = this.parseSelectParam();
    }
    return this._paths;
  }
  get filters() {
    if (!this._filters) {
      const filters = [];
      this.params.forEach((value, key) => {
        if (SUPPORTED_OPERATORS.some(
          (f) => key === f || value.split(".").includes(f)
        )) {
          const filter = this.parseFilterString(`${key}.${value}`, void 0);
          if (filter !== null)
            filters.push(filter);
        }
      });
      this._filters = filters;
    }
    return this._filters;
  }
  parseSelectParam(s, currentPath) {
    var _a;
    if (!s)
      s = (_a = this.params.get("select")) != null ? _a : void 0;
    if (!s)
      return [];
    const foreignTables = import_xregexp.default.matchRecursive(
      `,${s}`,
      ",[^,]*\\(",
      "\\)",
      "g",
      {
        valueNames: {
          "0": null,
          "1": "tableName",
          "2": "selectedColumns",
          "3": null
        }
      }
    ).reduce((prev, curr, idx, matches) => {
      if (curr.name === "selectedColumns") {
        const name = matches[idx - 1].value.slice(1, -1);
        prev = { ...prev, [name]: curr.value };
      }
      return prev;
    }, {});
    const columns = s.replace(
      new RegExp(
        `${Object.entries(foreignTables).map(
          ([table, selectedColumns]) => `${table}(${selectedColumns})`.replace(/\(/g, "\\(").replace(/\)/g, "\\)")
        ).join("|")}`,
        "g"
      ),
      ""
    ).replace(/(,)\1+/g, ",").split(",").filter((c) => c.length > 0).map((c) => c.split(":").shift());
    if (columns.includes("*"))
      throw new Error("Wildcard selector is not supported");
    return [
      ...columns.map(
        (c) => [currentPath, c && c.split(":").shift()].filter(Boolean).join(".")
      ),
      ...Object.entries(foreignTables).flatMap(
        ([table, selectedColumns]) => {
          var _a2;
          return this.parseSelectParam(
            `${selectedColumns}`,
            [currentPath, (_a2 = table.split(":").shift()) == null ? void 0 : _a2.split("!").shift()].filter(Boolean).join(".")
          );
        }
      )
    ];
  }
  parseFilterString(filter, prefix) {
    var _a, _b;
    if (filter.startsWith("and(") && filter.endsWith(")")) {
      const andFilters = filter.slice(4, -1).split(",").map((s) => this.parseFilterString(s, prefix)).filter(isNotNull);
      if (andFilters.length === 0)
        return null;
      else
        return { and: andFilters };
    }
    const split = filter.split(".");
    if ([split[0], split[1]].includes("or")) {
      let foreignTable;
      if (split[1] === "or") {
        foreignTable = split[0];
      }
      const orFilters = filter.slice(4 + (foreignTable ? foreignTable.length + 1 : 0), -1).split(",").reduce((prev, curr, idx, filters) => {
        if (curr.startsWith("and(")) {
          prev = [...prev, [curr, filters[idx + 1]].join()];
        } else if (!curr.endsWith(")")) {
          prev = [...prev, curr];
        }
        return prev;
      }, []).map((s) => this.parseFilterString(s, foreignTable)).filter(isNotNull);
      if (orFilters.length === 0)
        return null;
      else
        return { or: orFilters };
    }
    const path = [prefix, split[0]].filter(Boolean).join(".").replace(/\s/g, "").replace(/->>|->/g, ".");
    if (Array.isArray((_a = this.opts) == null ? void 0 : _a.exclusivePaths) && !((_b = this.opts) == null ? void 0 : _b.exclusivePaths.includes(path))) {
      return null;
    }
    const negate = split[1] === "not";
    const operator = negate ? split[2] : split[1];
    const value = (negate ? split.slice(3) : split.slice(2)).join(".");
    return {
      path,
      negate,
      operator,
      value: parseValue(value)
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OPERATOR_MAP,
  PostgrestFilterFnBuilder,
  PostgrestQueryParser,
  SUPPORTED_OPERATORS,
  isISODateString,
  isNotNull,
  parseValue
});
//# sourceMappingURL=index.js.map