import parseFilter, {
  Operator,
  parseCondition,
  Condition,
  Primitive,
  Range,
  parseRange,
  LogicalOperator,
  Filter
} from "../src/parser";
import {
  printOperator,
  printPrimitive,
  printCondition,
  printRangeOfPrimitives,
  printLogicalOperator,
  printFilter
} from "../src/printer";

test("Primitives", () => {
  expect(printPrimitive(123)).toBe("123");
  expect(printPrimitive(-123)).toBe("-123");
  expect(printPrimitive(0.511)).toBe("0.511");
  expect(printPrimitive(" a string ")).toBe(" a string ");
});

test("Operators", () => {
  const cases: { [k: string]: Operator } = Operator;
  for (const testCase in cases) {
    const [text, value] = [testCase, cases[testCase]];

    expect(printOperator(value)).toBe(text);
  }
});

test("Logical operators", () => {
  const cases: { [k: string]: LogicalOperator } = LogicalOperator;

  for (const testCase in cases) {
    const [text, value] = [testCase, cases[testCase]];

    expect(printLogicalOperator(value)).toBe(text);
  }
});

test("Conditions", () => {
  const cases: { [k: string]: Condition } = {
    "eq.20": { negated: false, operator: Operator.eq, value: 20 },
    "not.eq.20": { negated: true, operator: Operator.eq, value: 20 },
    "hi.not.eq.20": {
      ident: "hi",
      negated: true,
      operator: Operator.eq,
      value: 20
    },
    "cs.(example,new)": {
      negated: false,
      operator: Operator.cs,
      value: {
        left: { kind: "excluding", value: "example" },
        right: { kind: "excluding", value: "new" }
      }
    },
    // FIXME: PostgREST's 'in' operator supports parentheses-wrapped lists only, so this behaviour is incorrect
    "in.[1,2]": {
      negated: false,
      operator: Operator.in,
      value: {
        left: { kind: "including", value: 1 },
        right: { kind: "including", value: 2 }
      }
    },
    "in.(1,2,3)": {
      negated: false,
      operator: Operator.in,
      value: [1, 2, 3]
    }
  };

  for (const testCase in cases) {
    const [text, value] = [testCase, cases[testCase]];

    expect(printCondition(value)).toBe(text);
    expect(parseCondition.parse(text)).toMatchObject({ value });
  }
});

test("Ranges", () => {
  const cases: { [k: string]: Range<Primitive> } = {
    "[1,2]": {
      left: { kind: "including", value: 1 },
      right: { kind: "including", value: 2 }
    },
    "(1,2]": {
      left: { kind: "excluding", value: 1 },
      right: { kind: "including", value: 2 }
    },
    "(1,2)": {
      left: { kind: "excluding", value: 1 },
      right: { kind: "excluding", value: 2 }
    }
    // TODO:
    // "[2018-05-15,2019-06-01)": {
    //   left: { kind: "including", value: "2018-05-15" },
    //   right: { kind: "excluding", value: "2019-06-01" }
    // }
  };

  for (const testCase in cases) {
    const [text, value] = [testCase, cases[testCase]];

    expect(printRangeOfPrimitives(value)).toBe(text);
    expect(parseRange.parse(text)).toMatchObject({ value });
  }
});

test("Filters", () => {
  const cases: { [k: string]: Filter } = {
    "or(a.gte.100,a.lte.50)": {
      negated: false,
      operator: LogicalOperator.or,
      value: [
        { negated: false, ident: "a", operator: Operator.gte, value: 100 },
        { negated: false, ident: "a", operator: Operator.lte, value: 50 }
      ]
    },
    "and(or(a.gte.1,a.lte.2),not.lte.3)": {
      negated: false,
      operator: LogicalOperator.and,
      value: [
        {
          negated: false,
          operator: LogicalOperator.or,
          value: [
            { negated: false, ident: "a", operator: Operator.gte, value: 1 },
            { negated: false, ident: "a", operator: Operator.lte, value: 2 }
          ]
        },
        { negated: true, operator: Operator.lte, value: 3 }
      ]
    }
  };

  for (const testCase in cases) {
    const [text, value] = [testCase, cases[testCase]];

    expect(printFilter(value)).toBe(text);
    expect(parseFilter.parse(text)).toMatchObject({ value });
  }
});
