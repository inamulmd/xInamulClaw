import path from "node:path";      // 1. Load the path utility tool
                                   
export const PROJECT_ROOT =        // 3. Save the result into a variable
  path.resolve(".");               // 2. Use the tool to find the exact absolute root path
