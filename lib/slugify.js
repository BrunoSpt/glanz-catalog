// "Brinco Coração Cristal" -> "brinco-coracao-cristal"
// Shared by the build (product page URLs) and the data validation (duplicate check).
export function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
