import { parseFilter, Condition } from "../src/parser";
import { printFilter } from "../src/printer";

import { AstVisitor } from "../src/visitor";

test("Visitor is mutable", () => {
  const MyVisitor = class extends AstVisitor {
    visitCondition(val: Condition) {
      if (val.ident === undefined) {
        val.ident = "XYZ";
      }
      super.visitCondition(val);
    }
  };

  const text = "and(or(gte.1,lte.2),not.lte.3)";
  const { value } = parseFilter.parse(text);
  new MyVisitor().visit(value);
  expect(printFilter(value)).toBe("and(or(XYZ.gte.1,XYZ.lte.2),XYZ.not.lte.3)");
});
