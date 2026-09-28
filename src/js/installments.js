// Interest-free installments, shared by the build (product pages) and the browser (interest list total).
// rules: [{ above: 80, count: 2 }, ...] — a total strictly above `above` can be split in `count` payments.

export function installmentPlan(total, rules){
  const count = rules.reduce((best, rule) => (total > rule.above && rule.count > best ? rule.count : best), 1);
  if(count < 2) return null;
  return { count, value: Math.round((total / count) * 100) / 100 };
}
