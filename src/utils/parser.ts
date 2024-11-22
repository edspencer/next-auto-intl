// src/utils/parser.ts
import * as fs from "fs";
import { parse } from "@babel/parser";

export function parseFile(filePath: string) {
  const code = fs.readFileSync(filePath, "utf-8");
  return parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
}
