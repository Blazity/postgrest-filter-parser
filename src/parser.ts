type LogicOperator = "and" | "or";

type Operator =
  | "eq" // = equals
  | "gt" // > greater than
  | "gte" // >= greater than or equal
  | "lt" // < less than
  | "lte" // <= less than or equal
  | "neq" // <> or != not equal
  | "like" // LIKE LIKE operator (use * in place of %)
  | "ilike" // ILIKE ILIKE operator (use * in place of %)
  | "in" // IN one of a list of values, e.g. ?a=in.(1,2,3) – also supports commas in quoted strings like ?a=in.("hi,there","yes,you")
  | "is" // IS checking for exact equality (null,true,false)
  | "fts" // @@ Full-Text Search using to_tsquery
  | "plfts" // @@ Full-Text Search using plainto_tsquery
  | "phfts" // @@ Full-Text Search using phraseto_tsquery
  | "wfts" // @@ Full-Text Search using websearch_to_tsquery
  | "cs" // @> contains e.g. ?tags=cs.{example, new}
  | "cd" // <@ contained in e.g. ?values=cd.{1,2,3}
  | "ov" // && overlap (have points in common), e.g. ?period=ov.[2017-01-01,2017-06-30] – also supports array types, use curly braces instead of square brackets e.g. :code: ?arr=ov.{1,3}
  | "sl" // << strictly left of, e.g. ?range=sl.(1,10)
  | "sr" // >> strictly right of
  | "nxr" // &< does not extend to the right of, e.g. ?range=nxr.(1,10)
  | "nxl" // &> does not extend to the left of
  | "adj" // -|- is adjacent to, e.g. ?range=adj.(1,10)
  | "not"; // NOT negates another operator, see below
