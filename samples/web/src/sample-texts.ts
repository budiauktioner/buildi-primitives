export interface SampleText {
  readonly name: string;
  readonly text: string;
}

export const SAMPLE_TEXTS: readonly SampleText[] = [
  {
    name: "Mixed",
    text: `Skicka faktura till Budi AB, org.nr 559246-0421, VAT SE559246042101.
Kontakt: Anna Andersson, 19900807-2392, mobil +46 70 174 06 33.
Adress: Storgatan 12, 114 53 Stockholm.
Bankgiro: 5050-1055. IBAN: SE35 5000 0000 0549 1000 0003.`,
  },
  {
    name: "Personal",
    text: "Personnummer 19900807-2392 och samordningsnummer 19811263-2391 är båda giltiga.",
  },
  {
    name: "Organization",
    text: "Företaget Spotify AB har organisationsnummer 556703-7485 och momsregistreringsnummer SE556703748501.",
  },
  {
    name: "Contact",
    text: "Ring +46 70 174 06 33 eller skicka brev till Storgatan 12, 114 53 Stockholm.",
  },
  {
    name: "Geography",
    text: "Vi har kontor i Stockholms län och i Skåne. Levererar även till Tyskland och Finland.",
  },
];
