import {
  Condition,
  Filter,
  LogicalOperator,
  Operand,
  Operator,
  Range,
  Primitive,
  LogicalCondition
} from "./parser";

export class AstVisitor {
  visitPrimitive(val: Primitive) {}
  visitPrimitiveList(val: Primitive[]) {
    val.forEach(val => this.visitPrimitive(val));
  }
  visitPrimitiveRange(val: Range<Primitive>) {
    this.visitPrimitive(val.left.value);
    this.visitPrimitive(val.right.value);
  }
  visitOperand(val: Operand) {
    val instanceof Array
      ? this.visitPrimitiveList(val)
      : typeof val === "string" || typeof val === "number"
      ? this.visitPrimitive(val)
      : this.visitPrimitiveRange(val);
  }
  visitCondition(val: Condition) {
    this.visitOperand(val.value);
  }
  visitLogicalCondition(val: LogicalCondition) {
    val.value.forEach(val => this.visitFilter(val));
  }
  visitFilter(val: Filter) {
    isLogicalCondition(val)
      ? this.visitLogicalCondition(val)
      : this.visitCondition(val);
  }

  visit(val: Filter) {
    this.visitFilter(val);
  }
}

export function isLogicalCondition(cond: Filter): cond is LogicalCondition {
  return cond.operator in LogicalOperator;
}
