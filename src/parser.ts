import { anyStringOf, string } from "parjs";
import { map, then } from "parjs/combinators";

enum LogicOperator {
  "and" = "and",
  "or" = "or"
}

enum Operator {
  /** `=` equals */
  "eq" = "eq",
  /** `>` greater than */
  "gt" = "gt",
  /** `>=` greater than or equal */
  "gte" = "gte",
  /** `<` less than */
  "lt" = "lt",
  /** `<=` less than or equal */
  "lte" = "lte",
  /** `<>` or `!=` not equal */
  "neq" = "neq",
  /** `LIKE` LIKE operator (use * in place of %) */
  "like" = "like",
  /** `ILIKE` ILIKE operator (use * in place of %) */
  "ilike" = "ilike",
  /** `IN` one of a list of values, e.g. `?a=in.(1,2,3)` – also supports commas in quoted strings like `?a=in.("hi,there","yes,you")` */
  "in" = "in",
  /** `IS` checking for exact equality (null,true,false) */
  "is" = "is",
  /** `@@` Full-Text Search using `to_tsquery` */
  "fts" = "fts",
  /** `@@` Full-Text Search using `plainto_tsquery` */
  "plfts" = "plfts",
  /** `@@` Full-Text Search using `phraseto_tsquery` */
  "phfts" = "phfts",
  /** `@@` Full-Text Search using `websearch_to_tsquery` */
  "wfts" = "wfts",
  /** `@>` contains e.g. `?tags=cs.{example, new}` */
  "cs" = "cs",
  /** `<@` contained in e.g. `?values=cd.{1,2,3}` */
  "cd" = "cd",
  /** `&&` overlap (have points in common), e.g. `?period=ov.[2017-01-01,2017-06-30]` – also supports array types, use curly braces instead of square brackets e.g. :code: `?arr=ov.{1,3}` */
  "ov" = "ov",
  /** `<<` strictly left of, e.g. `?range=sl.(1,10)` */
  "sl" = "sl",
  /** `>>` strictly right of */
  "sr" = "sr",
  /** `&<` does not extend to the right of, e.g. `?range=nxr.(1,10)` */
  "nxr" = "nxr",
  /** `&>` does not extend to the left of */
  "nxl" = "nxl",
  /** `-|-` is adjacent to, e.g. `?range=adj.(1,10)` */
  "adj" = "adj",
  /** `NOT` negates another operator, see below */
  "not" = "not"
}

const SEPARATOR = ".";

const parseLogicalOperator = anyStringOf(
  ...Object.getOwnPropertyNames(LogicOperator)
).pipe(map(op => op as LogicOperator));

const parseOperator = anyStringOf(...Object.getOwnPropertyNames(Operator)).pipe(
  map(op => op as Operator)
);

const parseSeparator = string(SEPARATOR);
const parseNegation = string(Operator.not);

const parseIdentifier = string("unimplemented_id");
const parseValue = string("unimplemented_v");

const parseCondition = parseIdentifier.pipe(
  then(parseSeparator, parseOperator, parseSeparator, parseValue)
);
