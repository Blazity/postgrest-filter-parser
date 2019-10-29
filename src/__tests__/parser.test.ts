import * as Parser from "../parser";
import { Operator } from "../parser";
import { Parjser } from "parjs";

type TestCase<T> = [string, T];

function parses<T>(parseFn: Parjser<T>, [input, value]: TestCase<T>) {
  expect(parseFn.parse(input)).toMatchObject({ kind: "OK", value });
}

function parsesWith<T>(parseFn: Parjser<T>): (x: TestCase<T>) => void {
  return parses.bind(null, parseFn);
}

const op = (negated: boolean, operator: Parser.Operator, value: number) => ({
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
