// Collection headline at the top of the home page. The collection is replaced every `months` months
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

// "coleção de setembro e outubro" (the months listed already make the renewal clear)
export function collectionText(today, { firstCycle, months }){
  return `coleção de ${joinNames(currentCycle(today, firstCycle, months))}`;
}

// "Coleção de setembro e outubro", for the headline
export function collectionTitle(today, cycle){
  const text = collectionText(today, cycle);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function initCollectionNote(){
  const el = document.querySelector('[data-collection]');
  if(!el) return;
  // Without JavaScript the headline keeps the generic note ("Peças únicas")
  const { firstCycle, months } = el.dataset;
  el.textContent = collectionTitle(new Date(), { firstCycle, months: Number(months) });
}
