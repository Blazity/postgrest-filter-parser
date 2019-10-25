import {
  anyStringOf,
  string,
  int,
  regexp,
  whitespace,
  rest,
  noCharOf,
  float
} from "parjs";
import {
  map,
  then,
  maybe,
  or,
  recover,
  between,
  many,
  manySepBy
} from "parjs/combinators";

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

const parseValue = int();
// TODO: Make sure this matches PostgreSQL?
const parseIdentifier = regexp(/[A-Za-z_][A-Za-z_0-9]*/).pipe(
  map(x => x.join())
);

const parseSeparator = string(SEPARATOR);
const parseNegation = string(Operator.not);

const parseOperatorNegation = maybe<[string, string]>()(
  parseNegation.pipe(then(parseSeparator))
)
  .pipe(map(Boolean))
  // Don't consume the input if it doesn't match
  .pipe(or(string("")))
  .pipe(recover(() => ({ kind: "OK", value: false })));

const parseOperatorIdentifier = parseIdentifier
  .pipe(then(parseSeparator))
  .pipe(map(x => (x instanceof Array ? x[0] : null)))
  // Make it not consume the input if it doesn't match
  .pipe(or(string("")))
  .pipe(recover(() => ({ kind: "OK", value: "" })));

interface Condition {
  operator: Operator;
  value: string;
}

interface Including<T> {
  kind: "including";
  value: T;
}

interface Excluding<T> {
  kind: "excluding";
  value: T;
}

interface Range<T> {
  left: Including<T> | Excluding<T>;
  right: Including<T> | Excluding<T>;
}

const parseQuotedString = noCharOf('"')
  .pipe(many())
  .pipe(between('"'))
  .pipe(between(whitespace()))
  .pipe(map(x => x.join("")));

const parseNumeric = float().pipe(between(whitespace()));
/**
 * Parses a contiguous string which does not contain either of:
 * `,`, `.`, `:`, `()`.
 * See https://postgrest.org/en/v5.2/api.html#reserved-characters
 */
const parseContiguousTupleElement = noCharOf(" ,.:()").pipe(
  many(),
  map(x => x.join(""))
);
const parseCollectionElement = parseQuotedString.pipe(
  or(parseNumeric, parseContiguousTupleElement)
);

const parseOpenRange = string("(").pipe(or("["));
const parseEndRange = string(")").pipe(or("]"));

const parseRange = parseOpenRange
  .pipe(
    then(parseCollectionElement, ",", parseCollectionElement, parseEndRange)
  )
  .pipe(
    map(
      ([opening, left, comma, right, ending]) =>
        ({
          left: {
            kind: opening === "[" ? "including" : "excluding",
            value: left
          },
          right: {
            kind: ending === "]" ? "including" : "excluding",
            value: right
          }
        } as Range<string | number>)
    )
  );

string("(")
  .pipe(then(parseCollectionElement, ",", parseCollectionElement, ")"))
  .pipe(
    map(([lbrace, left, comma, right, rbrace]) => ({ start: left, end: right }))
  );

const parseCollectionElements = parseCollectionElement.pipe(
  between(whitespace()),
  manySepBy(",")
);

export const parseArray = parseCollectionElements
  .pipe(between("{", "}"))
  .pipe(or(parseCollectionElements.pipe(between("(", ")"))));

/**
 * Parser the remaining input as string. NOTE: This is probably not what you
 * want as this will greedily consume everything until the end.
 */
const parseString = rest();

const parsePositiveCondition = parseOperator
  .pipe(then(parseSeparator, parseValue))
  .pipe(map(([operator, _, value]) => ({ operator, value })));

export const parseCondition = parseOperatorNegation.pipe(
  then(parseOperatorIdentifier, parsePositiveCondition)
);

const parseOperand = parseCollectionElement.pipe(or(parseRange, parseArray));
