export function calculator(expression: string): number {
  const allowed = /^[0-9+\-*/().\s]+$/;

  if (!allowed.test(expression)) {
    throw new Error("Invalid mathematical expression");
  }

  return Function(`"use strict"; return (${expression})`)();
}