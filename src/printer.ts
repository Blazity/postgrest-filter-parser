import {
  Condition,
  Filter,
  LogicalOperator,
  Operand,
  Operator,
  Range,
  Primitive,
  LogicalCondition,
  isLogicalCondition
} from "./parser";

export function printPrimitive(val: Primitive): string {
  return val.toString();
}

export function printOperator(val: Operator): string {
  return val.toString();
}

export function printLogicalOperator(val: LogicalOperator): string {
  return val.toString();
}

function printArrayOfPrimitives(val: Primitive[]): string {
  // Normalize to curly braces
  return `{${val.map(printPrimitive).join(",")}}`;
}

export function printOperand(val: Operand): string {
  return val instanceof Array
    ? printArrayOfPrimitives(val)
    : typeof val === "string" || typeof val === "number"
    ? printPrimitive(val)
    : printRangeOfPrimitives(val);
}

export function printCondition(val: Condition): string {
  const { ident, negated, operator, value } = val;
  return [ident, negated ? "not" : undefined, operator, printOperand(value)]
    .filter(x => x !== undefined)
    .join(".");
}

export function printRangeOfPrimitives(val: Range<Primitive>): string {
  const left =
    val.left.kind == "including"
      ? `[${printPrimitive(val.left.value)}`
      : `(${printPrimitive(val.left.value)}`;
  const right =
    val.right.kind == "including"
      ? `${printPrimitive(val.right.value)}]`
      : `${printPrimitive(val.right.value)})`;
  return [left, right].join(",");
}

export function printFilter(val: Filter): string {
  return isLogicalCondition(val)
    ? printLogicalCondition(val)
    : printCondition(val);
}

function printFilters(val: Filter[]): string {
  return `(${val.map(printFilter).join(",")})`;
}

export function printLogicalCondition(val: LogicalCondition): string {
  const { negated, operator, value } = val;
  const printedOperator = [negated ? "not" : undefined, operator]
    .filter(x => x !== undefined)
    .join(".");

  return printedOperator + printFilters(value);
}
