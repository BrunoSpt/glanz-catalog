// Collection notice on the home page. The collection is replaced every `months` months
// starting from `firstCycle` ("2026-09"), so the current cycle is worked out from today's date
// in the customer's browser — nobody has to update it.

const monthName = (year, month) => new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long' });
const joinNames = (names) => names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}` : names[0];

// Month names of the cycle that contains `today`, e.g. ["setembro", "outubro"]
export function currentCycle(today, firstCycle, months){
  const [firstYear, firstMonth] = firstCycle.split('-').map(Number);
  const start0 = firstYear * 12 + (firstMonth - 1);
  const today0 = today.getFullYear() * 12 + today.getMonth();
  const cycleStart = start0 + Math.floor((today0 - start0) / months) * months;
  return Array.from({ length: months }, (_, i) => cycleStart + i)
    .map(m => monthName(Math.floor(m / 12), m % 12));
}

// "coleção de setembro e outubro · renovada a cada 2 meses"
export function collectionText(today, { firstCycle, months }){
  const every = months === 1 ? 'todo mês' : `a cada ${months} meses`;
  return `coleção de ${joinNames(currentCycle(today, firstCycle, months))} · renovada ${every}`;
}

export function initCollectionNote(){
  const note = document.querySelector('[data-collection]');
  if(!note) return;
  const { firstCycle, months, prefix } = note.dataset;
  // Without JavaScript the generic note stays ("coleção renovada a cada 2 meses")
  note.querySelector('[data-collection-text]').textContent =
    `${prefix} · ${collectionText(new Date(), { firstCycle, months: Number(months) })}`;
}
