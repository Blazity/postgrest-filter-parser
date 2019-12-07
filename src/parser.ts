import {
  anyStringOf,
  string,
  regexp,
  whitespace,
  noCharOf,
  float,
  Parjser
} from "parjs";
import {
  map,
  then,
  maybe,
  or,
  recover,
  between,
  many,
  manySepBy,
  composeCombinator,
  later
} from "parjs/combinators";

export enum LogicalOperator {
  "and" = "and",
  "or" = "or"
}

export enum Operator {
  /** `=` equals */
  "eq" = "eq",
  /** `>=` greater than or equal */
  "gte" = "gte",
  /** `>` greater than */
  "gt" = "gt",
  /** `<=` less than or equal */
  "lte" = "lte",
  /** `<` less than */
  "lt" = "lt",
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
  ...Object.getOwnPropertyNames(LogicalOperator)
).pipe(map(op => op as LogicalOperator));

const parseOperator = anyStringOf(...Object.getOwnPropertyNames(Operator)).pipe(
  map(op => op as Operator)
);

// TODO: Make sure this matches PostgreSQL?
const parseIdentifier = regexp(/[A-Za-z_][A-Za-z_0-9]*/).pipe(
  map(x => x.join())
);

const parseSeparator = string(SEPARATOR);
const parseNegation = string(Operator.not);

/**
 * If the Parser softly fails, then it acts as if it parsed successfully with
 * `value` and backtracks to the previous position.
 */
function consumeOrDefault<T>(value: T) {
  return composeCombinator(
    or(string("")),
    recover(() => ({ kind: "OK", value }))
  );
}

/** Optionally parses a `not.` operator negation */
const parseOperatorNegation = maybe<[string, string]>()(
  parseNegation.pipe(then(parseSeparator))
)
  .pipe(map(Boolean))
  .pipe(consumeOrDefault(false));

/** Optionally parses a `<ident>.` (not separated by quotes) */
const parseOperatorIdentifier = parseIdentifier
  .pipe(then(parseSeparator))
  .pipe(map(([ident, sep]) => ident))
  .pipe(consumeOrDefault(""));

export type Primitive = string | number;
export type Operand = Primitive | Primitive[] | Range<Primitive>;

/**
 * Single condition expression
 * @example `not.eq.20` or `some_ident.not.gte.50`
 */
export interface Condition {
  ident?: string;

  negated: boolean;
  operator: Operator;
  value: Operand;
}

/**
 * Logical expression (`and`, `or`)
 * @example `or(a.gte.100, a.lte.50)`
 */
export interface LogicalCondition {
  negated: boolean;
  operator: LogicalOperator;
  value: (Condition | LogicalCondition)[];
}

/** Main expression type */
export type Filter = Condition | LogicalCondition;

export interface Including<T> {
  kind: "including";
  value: T;
}

export interface Excluding<T> {
  kind: "excluding";
  value: T;
}

/**
 * Type that can represent a generic left-{open, closed} and
 * right-{open, closed} range
 */
export interface Range<T> {
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
const parseContiguousTupleElement = noCharOf(" ,.:(){}[]").pipe(
  many(),
  map(x => x.join(""))
);

export const parsePrimitive: Parjser<Primitive> = parseQuotedString.pipe(
  or(parseNumeric, parseContiguousTupleElement)
);

const parseOpenRange = string("(").pipe(or("["));
const parseEndRange = string(")").pipe(or("]"));

export const parseRange = parseOpenRange
  .pipe(then(parsePrimitive, ",", parsePrimitive, parseEndRange))
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

const parseCollectionElements = parsePrimitive.pipe(
  between(whitespace()),
  manySepBy(",")
);

export const parseArray = parseCollectionElements
  .pipe(between("{", "}"))
  .pipe(or(parseCollectionElements.pipe(between("(", ")"))));

const parseOperand: Parjser<Operand> = parseRange
  // If we can't parse a range, backtrack and try to parse as array (since these
  // can be parsed similarly)
  .pipe(recover<Range<string | number>>(st => ({ kind: "Soft" })))
  .pipe(or(parseArray, parsePrimitive));

const parsePositiveCondition = parseOperator
  .pipe(then(parseSeparator, parseOperand))
  .pipe(map(([operator, _, value]) => ({ operator, value })));

const parseConditionShorthand = parseOperatorNegation.pipe(
  then(parsePositiveCondition),
  map(([negated, rest]) => ({ negated, ...rest }))
);

export const parseCondition =
  // Resolve ambiguities, e.g. `not.eq.20` as negated operator
  string("")
    .pipe(then(parseConditionShorthand))
    // ...rather than just a regular identifier "not"
    .pipe(or(parseOperatorIdentifier.pipe(then(parseConditionShorthand))))
    .pipe(
      map(([ident, cond]) => (ident ? { ident, ...cond } : (cond as Condition)))
    );

const _parseFilter = later<Condition | LogicalCondition>();

const parseFilterList = _parseFilter.pipe(
  between(whitespace()),
  manySepBy(",")
);

export const parseLogicExpr = parseOperatorNegation.pipe(
  then(
    parseLogicalOperator.pipe(then(parseFilterList.pipe(between("(", ")"))))
  ),
  map(
    ([negated, [operator, value]]) =>
      ({ negated, operator, value } as LogicalCondition)
  )
);

_parseFilter.init(
  parseCondition.pipe(
    recover<Condition>(st => ({ kind: "Soft" })),
    or(parseLogicExpr)
  )
);

/**
 * Main filter tree parser, parses a condition or a logically {con,dis}joined
 * condition tree
 */
export const parseFilter: Parjser<Condition | LogicalCondition> = _parseFilter;
export default parseFilter;
