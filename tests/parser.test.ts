import * as Parser from "../src/parser";
import { Operator, Operand } from "../src/parser";
import { Parjser } from "parjs";

type TestCase<T> = [string, T];

function parses<T>(parseFn: Parjser<T>, [input, value]: TestCase<T>) {
  expect(parseFn.parse(input)).toMatchObject({ kind: "OK", value });
}

function parsesWith<T>(parseFn: Parjser<T>): (x: TestCase<T>) => void {
  return parses.bind(null, parseFn);
}

const op = (
  negated: boolean,
  operator: Operator,
  value: Operand,
  ident?: string
) => ({
  ...(ident ? { ident } : {}),
  negated,
  operator,
  value
});

test("arrays", () => {
  parses(Parser.parseArray, [
    '(sa, caca, 1.51, 124, -151, ",,,DSAD" )',
    ["sa", "caca", 1.51, 124, -151, ",,,DSAD"]
  ]);
});

test("conditions", () => {
  const parsesCondition = parsesWith(Parser.parseCondition);

  parsesCondition(["ident.not.eq.20", op(true, Operator.eq, 20, "ident")]);
  parsesCondition(["ident.eq.20", op(false, Operator.eq, 20, "ident")]);
  parsesCondition(["not.eq.20", op(true, Operator.eq, 20)]);
  parsesCondition(["eq.20", op(false, Operator.eq, 20)]);
});

test("operands", () => {
  const parsesCondition = parsesWith(Parser.parseCondition);
  const includingKind = (val: boolean) => (val ? "including" : "excluding");
  const testRange = (left: [boolean, number], right: [boolean, number]) =>
    ({
      left: { kind: includingKind(left[0]), value: left[1] },
      right: { kind: includingKind(right[0]), value: right[1] }
    } as Parser.Range<number>);

  parsesCondition(['eq."a"', op(false, Operator.eq, "a")]);
  parsesCondition([
    "in.[1,2]",
    op(false, Operator.in, testRange([true, 1], [true, 2]))
  ]);
  parsesCondition([
    "in.(1,2)",
    op(false, Operator.in, testRange([false, 1], [false, 2]))
  ]);
  parsesCondition([
    "in.(1,2]",
    op(false, Operator.in, testRange([false, 1], [true, 2]))
  ]);
  parsesCondition([
    "in.[1,2)",
    op(false, Operator.in, testRange([true, 1], [false, 2]))
  ]);
  parsesCondition(["in.(5,6,7)", op(false, Operator.in, [5, 6, 7])]);
  parsesCondition([
    "cs.{example, new}",
    op(false, Operator.cs, ["example", "new"])
  ]);
  parsesCondition([
    "cs.(example, new)",
    op(false, Operator.cs, ["example", "new"])
  ]);
});

// TODO:
test("logic expressions", () => {
  const parsesExpr = parsesWith(Parser.parseFilter);
  parsesExpr([
    "and()",
    { negated: false, operator: Parser.LogicalOperator.and, value: [] }
  ]);
  // prettier-ignore
  parsesExpr([
    "and(and(or(), or()))",
    { negated: false, operator: Parser.LogicalOperator.and, value: [
      { negated: false, operator: Parser.LogicalOperator.and, value: [
        { negated: false, operator: Parser.LogicalOperator.or, value: [] },
        { negated: false, operator: Parser.LogicalOperator.or, value: [] },
      ]},
    ]}
  ]);
  parsesExpr([
    "not.and()",
    { negated: true, operator: Parser.LogicalOperator.and, value: [] }
  ]);
  parsesExpr([
    "and(eq.20)",
    {
      negated: false,
      operator: Parser.LogicalOperator.and,
      value: [op(false, Operator.eq, 20)]
    }
  ]);
  // prettier-ignore
  parsesExpr([
    'and(  eq.20, some.not.eq.25, eq."heh" )',
    { negated: false, operator: Parser.LogicalOperator.and, value: [
      op(false, Operator.eq, 20),
      op(true, Operator.eq, 25, "some"),
      op(false, Operator.eq, "heh")
    ]},
  ]);
  // prettier-ignore
  parsesExpr([
    "and(and(or(eq.20), or()))",
    { negated: false, operator: Parser.LogicalOperator.and, value: [
      { negated: false, operator: Parser.LogicalOperator.and, value: [
        { negated: false, operator: Parser.LogicalOperator.or, value: [
          op(false, Operator.eq, 20)
        ]},
        { negated: false, operator: Parser.LogicalOperator.or, value: [] },
      ]},
    ]}
  ]);
  // prettier-ignore
  parsesExpr(["and(a.eq.20,b.in.(1,2,3), not.or(lt.15, not.gte.5))",
    { negated: false, operator: Parser.LogicalOperator.and, value: [
      op(false, Operator.eq, 20, "a"),
      op(false, Operator.in, [1,2,3], "b"),
      { negated: true, operator: Parser.LogicalOperator.or, value: [
        op(false, Operator.lt, 15),
        op(true, Operator.gte, 5),
      ]},
    ]}
  ]);
});
