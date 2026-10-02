// Product order and price ranges, shared by the build (default order of the category pages)
// and the browser (sort and filter controls on those pages, js/catalog-tools.js).

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
const byName = (a, b) => collator.compare(a.name, b.name);

// Values are the ones used in the address (?ordem=menor-preco)
const SORTS = {
  'a-z': byName,
  'menor-preco': (a, b) => a.price - b.price || byName(a, b),
  'maior-preco': (a, b) => b.price - a.price || byName(a, b),
};

export const DEFAULT_SORT = 'a-z';
export const isSort = (value) => Object.prototype.hasOwnProperty.call(SORTS, value); // Object.hasOwn needs iOS 15.4

// items: [{ name, price, soldOut }]. Sold pieces always go last, whatever the order chosen.
export function sortProducts(items, sort = DEFAULT_SORT){
  const compare = SORTS[sort] || SORTS[DEFAULT_SORT];
  return [...items].sort((a, b) => Number(!!a.soldOut) - Number(!!b.soldOut) || compare(a, b));
}

// Price ranges follow the installment thresholds ([80, 130, 210] -> "Até R$ 80", "R$ 80 a R$ 130",
// "R$ 130 a R$ 210", "Acima de R$ 210"), so filtering by budget also tells the number of installments.
// Like the installment rules, "acima de 80" is strictly above: R$ 80,00 is in "Até R$ 80".
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

export function priceRanges(thresholds){
  const limits = [...new Set(thresholds)].sort((a, b) => a - b);
  if(!limits.length) return [];
  const ranges = limits.map((max, i) => (i === 0
    ? { id: `ate-${max}`, min: 0, max, label: `Até ${money.format(max)}` }
    : { id: `${limits[i - 1]}-${max}`, min: limits[i - 1], max, label: `${money.format(limits[i - 1])} a ${money.format(max)}` }));
  const last = limits[limits.length - 1];
  ranges.push({ id: `acima-${last}`, min: last, max: Infinity, label: `Acima de ${money.format(last)}` });
  return ranges;
}

export const inRange = (price, range) => price > range.min && price <= range.max;
