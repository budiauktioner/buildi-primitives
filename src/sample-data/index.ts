import { PhoneNumber } from "../contact/index.js";
import { GeoCoordinate, Language, SwedishCounty, SwedishMunicipality } from "../geography/index.js";
import {
  DunsNumber,
  ElfCode,
  EuVatNumber,
  LeiCode,
  SwedishOrganizationNumber,
  SwedishSniCode,
} from "../organization/index.js";
import { EmailAddress, Url } from "../web/index.js";
import { Currency, Isin, MoneyAmount } from "../finance/index.js";
import { SwedishPropertyDesignation, SwedishPropertyTaxationCode } from "../property/index.js";
import {
  Bic,
  Iban,
  SwedishBankAccount,
  SwedishBankAccountHolderName,
  SwedishBankClearingNumber,
  SwedishBankgiroNumber,
  SwedishOcrReferenceNumber,
  SwedishPostgiroNumber,
  SwedishSwishNumber,
} from "../banking/index.js";

const PhoneNumberSamples = Object.freeze({
  systembolaget: PhoneNumber.parse("+46850330000"),
  sj: PhoneNumber.parse("+46107516000"),
  vattenfall: PhoneNumber.parse("+4687396000"),
  samhall: PhoneNumber.parse("+4620572572"),
  stockholmsKommun: PhoneNumber.parse("+46850829000"),
  svenskaKyrkan: PhoneNumber.parse("+4618169500"),
  folksam: PhoneNumber.parse("+46771950950"),
  kooperativaForbundet: PhoneNumber.parse("+46107400000"),
  swedishMobileTest: PhoneNumber.parse("+46701740605"),
  swedishFixedTest: PhoneNumber.parse("+4681234567"),
});

const SwedishCountySamples = Object.freeze({
  stockholm: SwedishCounty.parse("01"),
  uppsala: SwedishCounty.parse("03"),
  vastraGotaland: SwedishCounty.parse("14"),
  skane: SwedishCounty.parse("12"),
  norrbotten: SwedishCounty.parse("25"),
});

const SwedishMunicipalitySamples = Object.freeze({
  stockholm: SwedishMunicipality.parse("Stockholm"),
  solna: SwedishMunicipality.parse("Solna"),
  uppsala: SwedishMunicipality.parse("Uppsala"),
  lulea: SwedishMunicipality.parse("Luleå"),
  goteborg: SwedishMunicipality.parse("Göteborg"),
  malmo: SwedishMunicipality.parse("Malmö"),
});

const LanguageSamples = Object.freeze({
  swedish: Language.parse("sv"),
  english: Language.parse("en"),
  german: Language.parse("de"),
  french: Language.parse("fr"),
  spanish: Language.parse("es"),
  arabic: Language.parse("ar"),
  finnish: Language.parse("fi"),
  norwegian: Language.parse("no"),
  danish: Language.parse("da"),
});

const GeoCoordinateSamples = Object.freeze({
  stockholm: GeoCoordinate.parse("59.3293, 18.0686"),
  gothenburg: GeoCoordinate.parse("57.7089, 11.9746"),
  malmo: GeoCoordinate.parse("55.6050, 13.0038"),
  lulea: GeoCoordinate.parse("65.5848, 22.1547"),
  nullIsland: GeoCoordinate.parse("0, 0"),
});

const OrganizationNumberSamples = Object.freeze({
  budiAB: SwedishOrganizationNumber.parse("559246-0421"),
  systembolaget: SwedishOrganizationNumber.parse("556059-9473"),
  sj: SwedishOrganizationNumber.parse("556196-1599"),
  postNord: SwedishOrganizationNumber.parse("556711-5695"),
  vattenfall: SwedishOrganizationNumber.parse("556036-2138"),
  samhall: SwedishOrganizationNumber.parse("556448-1397"),
  lkab: SwedishOrganizationNumber.parse("556001-5835"),
  svt: SwedishOrganizationNumber.parse("556033-4285"),
  sverigesRadio: SwedishOrganizationNumber.parse("556419-3232"),
  telia: SwedishOrganizationNumber.parse("556430-0142"),
  stockholmsKommun: SwedishOrganizationNumber.parse("212000-0142"),
  skr: SwedishOrganizationNumber.parse("222000-0315"),
  svenskaKyrkan: SwedishOrganizationNumber.parse("252002-6135"),
  folksam: SwedishOrganizationNumber.parse("502006-1619"),
  lantmannen: SwedishOrganizationNumber.parse("769605-2856"),
  kooperativaForbundet: SwedishOrganizationNumber.parse("702001-1693"),
  skatteverket: SwedishOrganizationNumber.parse("202100-5448"),
  forsakringskassan: SwedishOrganizationNumber.parse("202100-5521"),
  arbetsformedlingen: SwedishOrganizationNumber.parse("202100-2114"),
  bolagsverket: SwedishOrganizationNumber.parse("202100-5000"),
  trafikverket: SwedishOrganizationNumber.parse("202100-6297"),
  lantmateriet: SwedishOrganizationNumber.parse("202100-4888"),
  kronofogden: SwedishOrganizationNumber.parse("202100-2809"),
  transportstyrelsen: SwedishOrganizationNumber.parse("202100-6099"),
  migrationsverket: SwedishOrganizationNumber.parse("202100-2163"),
  tullverket: SwedishOrganizationNumber.parse("202100-0969"),
});

const EuVatNumberSamples = Object.freeze({
  budiAB: EuVatNumber.parse("SE559246042101"),
  systembolaget: EuVatNumber.parse("SE556059947301"),
  sj: EuVatNumber.parse("SE556196159901"),
  postNord: EuVatNumber.parse("SE556711569501"),
  vattenfall: EuVatNumber.parse("SE556036213801"),
  samhall: EuVatNumber.parse("SE556448139701"),
  lkab: EuVatNumber.parse("SE556001583501"),
  svt: EuVatNumber.parse("SE556033428501"),
  sverigesRadio: EuVatNumber.parse("SE556419323201"),
  telia: EuVatNumber.parse("SE556430014201"),
});

const LeiCodeSamples = Object.freeze({
  vattenfall: LeiCode.parse("549300T5RZ1HA5HZ3109"),
  lkab: LeiCode.parse("549300ONBUTV20237K19"),
  folksam: LeiCode.parse("5493003384H0SVUD4J19"),
});

const DunsNumberSamples = Object.freeze({
  budiAB: DunsNumber.parse("350827673"),
});

const ElfCodeSamples = Object.freeze({
  aktiebolag: ElfCode.parse("XTIQ"),
  handelsbolag: ElfCode.parse("N2GY"),
  enskildFirma: ElfCode.parse("WJEL"),
  stiftelse: ElfCode.parse("CLBQ"),
});

const SwedishSniCodeSamples = Object.freeze({
  budiAB: SwedishSniCode.parse("47917"),
  systembolaget: SwedishSniCode.parse("47250"),
  sj: SwedishSniCode.parse("49100"),
  postNord: SwedishSniCode.parse("53100"),
  vattenfall: SwedishSniCode.parse("35120"),
  samhall: SwedishSniCode.parse("81210"),
  lkab: SwedishSniCode.parse("07100"),
  telia: SwedishSniCode.parse("61100"),
  skr: SwedishSniCode.parse("94112"),
  svenskaKyrkan: SwedishSniCode.parse("94910"),
  folksam: SwedishSniCode.parse("65120"),
  lantmannen: SwedishSniCode.parse("46210"),
  kooperativaForbundet: SwedishSniCode.parse("70100"),
});

export const ContactSampleData = Object.freeze({
  PhoneNumber: Object.freeze({
    ...PhoneNumberSamples,
    all: Object.freeze(Object.values(PhoneNumberSamples)),
  }),
});

export const GeographySampleData = Object.freeze({
  SwedishCounty: Object.freeze({
    ...SwedishCountySamples,
    all: Object.freeze(Object.values(SwedishCountySamples)),
  }),
  SwedishMunicipality: Object.freeze({
    ...SwedishMunicipalitySamples,
    all: Object.freeze(Object.values(SwedishMunicipalitySamples)),
  }),
  Language: Object.freeze({
    ...LanguageSamples,
    all: Object.freeze(Object.values(LanguageSamples)),
  }),
  GeoCoordinate: Object.freeze({
    ...GeoCoordinateSamples,
    all: Object.freeze(Object.values(GeoCoordinateSamples)),
  }),
});

const EmailAddressSamples = Object.freeze({
  samhall: EmailAddress.parse("kontakt@samhall.se"),
  lkab: EmailAddress.parse("redovisning@lkab.com"),
  example: EmailAddress.parse("user@example.com"),
  exampleOrg: EmailAddress.parse("info@example.org"),
});

const UrlSamples = Object.freeze({
  samhall: Url.parse("https://samhall.se"),
  lkab: Url.parse("https://lkab.com"),
  example: Url.parse("https://example.com"),
  exampleOrg: Url.parse("https://example.org"),
});

export const WebSampleData = Object.freeze({
  EmailAddress: Object.freeze({
    ...EmailAddressSamples,
    all: Object.freeze(Object.values(EmailAddressSamples)),
  }),
  Url: Object.freeze({
    ...UrlSamples,
    all: Object.freeze(Object.values(UrlSamples)),
  }),
});

const CurrencySamples = Object.freeze({
  sek: Currency.SEK,
  eur: Currency.EUR,
  usd: Currency.USD,
  nok: Currency.NOK,
  dkk: Currency.DKK,
  gbp: Currency.GBP,
});

const IsinSamples = Object.freeze({
  ericsson: Isin.parse("SE0000108656"),
  telia: Isin.parse("SE0000667891"),
  apple: Isin.parse("US0378331005"),
});

const MoneyAmountSamples = Object.freeze({
  oneThousandSek: MoneyAmount.create(1000, Currency.SEK),
  hundredEur: MoneyAmount.create(100, Currency.EUR),
  fiveHundredUsd: MoneyAmount.create(500, Currency.USD),
});

export const FinanceSampleData = Object.freeze({
  Currency: Object.freeze({
    ...CurrencySamples,
    all: Object.freeze(Object.values(CurrencySamples)),
  }),
  Isin: Object.freeze({
    ...IsinSamples,
    all: Object.freeze(Object.values(IsinSamples)),
  }),
  MoneyAmount: Object.freeze({
    ...MoneyAmountSamples,
    all: Object.freeze(Object.values(MoneyAmountSamples)),
  }),
});

const SwedishPropertyDesignationSamples = Object.freeze({
  uppsalaDomkyrka: SwedishPropertyDesignation.parse("Uppsala Fjärdingen 22:1"),
  genericUrban: SwedishPropertyDesignation.parse("Stockholm Norrmalm 3:12"),
  genericRural: SwedishPropertyDesignation.parse("Gävle Olsbacka 11:1"),
});

const SwedishPropertyTaxationCodeSamples = Object.freeze({
  smahusBebyggd: SwedishPropertyTaxationCode.parse("220"),
  hyreshusBostad: SwedishPropertyTaxationCode.parse("320"),
  industriBebyggd: SwedishPropertyTaxationCode.parse("420"),
});

export const PropertySampleData = Object.freeze({
  SwedishPropertyDesignation: Object.freeze({
    ...SwedishPropertyDesignationSamples,
    all: Object.freeze(Object.values(SwedishPropertyDesignationSamples)),
  }),
  SwedishPropertyTaxationCode: Object.freeze({
    ...SwedishPropertyTaxationCodeSamples,
    all: Object.freeze(Object.values(SwedishPropertyTaxationCodeSamples)),
  }),
});

const IbanSamples = Object.freeze({
  vattenfall: Iban.parse("SE7495000099604203849767"),
  swedishGeneric: Iban.parse("SE4550000000058398257466"),
  germanGeneric: Iban.parse("DE89370400440532013000"),
  britishGeneric: Iban.parse("GB29NWBK60161331926819"),
});

const BicSamples = Object.freeze({
  nordea: Bic.parse("NDEASESS"),
  seb: Bic.parse("ESSESESS"),
  swedbank: Bic.parse("SWEDSESS"),
  handelsbanken: Bic.parse("HANDSESS"),
});

const SwedishBankgiroNumberSamples = Object.freeze({
  budiAB: SwedishBankgiroNumber.parse("235-9321"),
  vattenfall: SwedishBankgiroNumber.parse("5110-8348"),
  telia: SwedishBankgiroNumber.parse("5117-7913"),
  svenskaKyrkan: SwedishBankgiroNumber.parse("900-1223"),
});

const SwedishPostgiroNumberSamples = Object.freeze({
  vattenfall: SwedishPostgiroNumber.parse("4131300-8"),
  svenskaKyrkan: SwedishPostgiroNumber.parse("900122-3"),
});

const SwedishOcrReferenceNumberSamples = Object.freeze({
  generic: SwedishOcrReferenceNumber.parse("12345674"),
  short: SwedishOcrReferenceNumber.parse("18"),
});

const SwedishBankClearingNumberSamples = Object.freeze({
  seb: SwedishBankClearingNumber.parse("5001"),
  handelsbanken: SwedishBankClearingNumber.parse("6789"),
  swedbank: SwedishBankClearingNumber.parse("81234"),
  nordeaPersonkonto: SwedishBankClearingNumber.parse("3300"),
});

const SwedishBankAccountSamples = Object.freeze({
  seb: SwedishBankAccount.parse("50011234567"),
  swedbank: SwedishBankAccount.parse("81234123456"),
  nordeaPersonkonto: SwedishBankAccount.parse("33001234567890"),
});

const SwedishBankAccountHolderNameSamples = Object.freeze({
  person: SwedishBankAccountHolderName.parse("Anna Andersson"),
  organization: SwedishBankAccountHolderName.parse("VOLVO AB"),
});

const SwedishSwishNumberSamples = Object.freeze({
  rodaKorset: SwedishSwishNumber.parse("1236652895"),
  raddaBarnen: SwedishSwishNumber.parse("9020033"),
});

export const BankingSampleData = Object.freeze({
  Iban: Object.freeze({
    ...IbanSamples,
    all: Object.freeze(Object.values(IbanSamples)),
  }),
  Bic: Object.freeze({
    ...BicSamples,
    all: Object.freeze(Object.values(BicSamples)),
  }),
  SwedishBankgiroNumber: Object.freeze({
    ...SwedishBankgiroNumberSamples,
    all: Object.freeze(Object.values(SwedishBankgiroNumberSamples)),
  }),
  SwedishPostgiroNumber: Object.freeze({
    ...SwedishPostgiroNumberSamples,
    all: Object.freeze(Object.values(SwedishPostgiroNumberSamples)),
  }),
  SwedishOcrReferenceNumber: Object.freeze({
    ...SwedishOcrReferenceNumberSamples,
    all: Object.freeze(Object.values(SwedishOcrReferenceNumberSamples)),
  }),
  SwedishBankClearingNumber: Object.freeze({
    ...SwedishBankClearingNumberSamples,
    all: Object.freeze(Object.values(SwedishBankClearingNumberSamples)),
  }),
  SwedishBankAccount: Object.freeze({
    ...SwedishBankAccountSamples,
    all: Object.freeze(Object.values(SwedishBankAccountSamples)),
  }),
  SwedishBankAccountHolderName: Object.freeze({
    ...SwedishBankAccountHolderNameSamples,
    all: Object.freeze(Object.values(SwedishBankAccountHolderNameSamples)),
  }),
  SwedishSwishNumber: Object.freeze({
    ...SwedishSwishNumberSamples,
    all: Object.freeze(Object.values(SwedishSwishNumberSamples)),
  }),
});

export const OrganizationSampleData = Object.freeze({
  OrganizationNumber: Object.freeze({
    ...OrganizationNumberSamples,
    all: Object.freeze(Object.values(OrganizationNumberSamples)),
  }),
  EuVatNumber: Object.freeze({
    ...EuVatNumberSamples,
    all: Object.freeze(Object.values(EuVatNumberSamples)),
  }),
  LeiCode: Object.freeze({
    ...LeiCodeSamples,
    all: Object.freeze(Object.values(LeiCodeSamples)),
  }),
  DunsNumber: Object.freeze({
    ...DunsNumberSamples,
    all: Object.freeze(Object.values(DunsNumberSamples)),
  }),
  ElfCode: Object.freeze({
    ...ElfCodeSamples,
    all: Object.freeze(Object.values(ElfCodeSamples)),
  }),
  SwedishSniCode: Object.freeze({
    ...SwedishSniCodeSamples,
    all: Object.freeze(Object.values(SwedishSniCodeSamples)),
  }),
});
