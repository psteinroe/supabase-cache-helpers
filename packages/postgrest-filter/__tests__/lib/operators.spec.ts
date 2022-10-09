import { FilterOperator, OPERATOR_MAP, OperatorFn } from "../../src";

const dateA = new Date();
const dateB = new Date();
dateB.setFullYear(dateA.getFullYear() + 1);

const TESTS = [
  [dateA, "eq", new Date(dateA.getTime()), true],
  ["test", "eq", "test", true],
  ["test", "eq", "test-2", false],

  [dateA, "neq", new Date(dateA.getTime()), false],
  ["test", "neq", "test-2", true],
  ["test", "neq", "test", false],

  [dateB, "gt", dateA, true],
  [dateA, "gt", dateB, false],
  [1, "gt", 0, true],
  [0, "gt", 1, false],

  [1, "gte", 0, true],
  [1, "gte", 1, true],
  [0, "gte", 1, false],

  [0, "lt", 1, true],
  [1, "lt", 0, false],

  [0, "lte", 1, true],
  [1, "lte", 1, true],
  [1, "lte", 0, false],

  ["some-test", "like", "%test", true],
  ["some-Test", "like", "%test", false],
  ["some-test-case", "like", "%test%", true],
  ["some-test-case", "like", "%test", false],
  ["some-test-case", "like", "test%", false],

  ["some-test", "ilike", "%test", true],
  ["some-Test", "ilike", "%test", true],
  ["some-test-case", "ilike", "%test%", true],
  ["some-test-case", "ilike", "%test", false],
  ["some-test-case", "ilike", "test%", false],

  [true, "is", true, true],
  [null, "is", null, true],
  [false, "is", true, false],
  ["value", "is", null, false],

  ["test", "in", "(value,test)", true],
  ["test", "in", "(value)", false],

  [[{ value: "a" }, { value: "b" }], "cs", [{ value: "b" }], true],
  [["test", "test-2", "test-3"], "cs", "{test,test-2}", true],
  [["test", "test-3"], "cs", "{test,test-2}", false],
  [null, "cs", "{test,test-2}", false],

  [["test", "test-2"], "cd", "{test,test-2,test-3}", true],
  [["test", "test-2"], "cd", "{test,test-3}", false],
  [null, "cd", "{test,test-2}", false],

  [
    "'+4917630000807':4 '1':5 'laureen':1 'test':2 'test@hotmail2.de':3",
    "fts",
    "laur:* & Te:*",
    true,
  ],
  [
    "'+4917630000807':4 '1':5 'laureen':1 'test':2 'test@hotmail2.de':3",
    "fts",
    "i:* & f:*",
    false,
  ],
  [
    "'+4917630000807':4 '1':5 'laureen':1 'test':2 'test@hotmail2.de':3",
    "fts",
    "",
    false,
  ],

  ["some-test-case", "plfts", "%test%", true],
  ["some-test-case", "plfts", "%wrong%", false],
];

describe("operators", () => {
  it.each(TESTS)("%s %s %s should be %s", (...args) => {
    const [colValue, operator, cmpValue, expected] = args;
    const operatorFn = OPERATOR_MAP[
      operator as unknown as FilterOperator
    ] as OperatorFn;
    expect(operatorFn(colValue, cmpValue)).toEqual(expected);
  });
});
