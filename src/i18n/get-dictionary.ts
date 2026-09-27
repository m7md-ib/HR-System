import ar from "./dictionaries/ar";
import en from "./dictionaries/en";
import type { Locale } from "./config";

const dictionaries = { ar, en };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
