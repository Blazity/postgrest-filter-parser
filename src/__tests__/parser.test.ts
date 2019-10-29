import * as Parser from "../parser";
import { Operator, Operand } from "../parser";
import { Parjser } from "parjs";

type TestCase<T> = [string, T];

function parses<T>(parseFn: Parjser<T>, [input, value]: TestCase<T>) {
  expect(parseFn.parse(input)).toMatchObject({ kind: "OK", value });
}

function parsesWith<T>(parseFn: Parjser<T>): (x: TestCase<T>) => void {
  return parses.bind(null, parseFn);
}

const op = (negated: boolean, operator: Operator, value: Operand) => ({
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
  const parsesCondition = parsesWith(Parser.parseEntireCondition);

  parsesCondition(["ident.not.eq.20", ["ident", op(true, Operator.eq, 20)]]);
  parsesCondition(["ident.eq.20", ["ident", op(false, Operator.eq, 20)]]);
  parsesCondition(["not.eq.20", ["", op(true, Operator.eq, 20)]]);
  parsesCondition(["eq.20", ["", op(false, Operator.eq, 20)]]);
});

test("operands", () => {
  const parsesCondition = parsesWith(Parser.parseEntireCondition);
  const includingKind = (val: boolean) => (val ? "including" : "excluding");
  const testRange = (left: [boolean, number], right: [boolean, number]) =>
    ({
      left: { kind: includingKind(left[0]), value: left[1] },
      right: { kind: includingKind(right[0]), value: right[1] }
    } as Parser.Range<number>);

  parsesCondition(['eq."a"', ["", op(false, Operator.eq, "a")]]);
  parsesCondition([
    "in.[1,2]",
    ["", op(false, Operator.in, testRange([true, 1], [true, 2]))]
  ]);
  parsesCondition([
    "in.(1,2)",
    ["", op(false, Operator.in, testRange([false, 1], [false, 2]))]
  ]);
  parsesCondition([
    "in.(1,2]",
    ["", op(false, Operator.in, testRange([false, 1], [true, 2]))]
  ]);
  parsesCondition([
    "in.[1,2)",
    ["", op(false, Operator.in, testRange([true, 1], [false, 2]))]
  ]);
  parsesCondition(["in.(5,6,7)", ["", op(false, Operator.in, [5, 6, 7])]]);
  parsesCondition([
    "cs.{example, new}",
    ["", op(false, Operator.cs, ["example", "new"])]
  ]);
  parsesCondition([
    "cs.(example, new)",
    ["", op(false, Operator.cs, ["example", "new"])]
  ]);
});
