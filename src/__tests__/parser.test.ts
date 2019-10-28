import * as Parser from "../parser";
import { Parjser } from "parjs";

function assertParsedWith<T>(parseFn: Parjser<T>, input: string, output: T) {
  expect(parseFn.parse(input)).toMatchObject({ kind: "OK", value: output });
}

test("primitives", () => {
  assertParsedWith(
    Parser.parseArray,
    '(sa, caca, 1.51, 124, -151, ",,,DSAD" )',
    ["sa", "caca", 1.51, 124, -151, ",,,DSAD"]
  );
});
