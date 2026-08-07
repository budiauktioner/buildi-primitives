import { SwedishBank } from "./swedish-bank.js";

/**
 * Resolves a Swedish bank from a 4-digit clearing prefix.
 *
 * Equivalent of the .NET internal `BankResolver`.
 *
 * @internal
 */

function inRange(value: number, start: number, end: number): boolean {
  return value >= start && value <= end;
}

export function isNordeaPersonkonto(c: number): boolean {
  return c === 3300 || c === 3782;
}

export function isSEB(c: number): boolean {
  return inRange(c, 5000, 5999) || inRange(c, 9120, 9124) || inRange(c, 9130, 9149);
}

export function isHandelsbanken(c: number): boolean {
  return inRange(c, 6000, 6999);
}

export function isNordeaOrdinary(c: number): boolean {
  return (
    inRange(c, 1100, 1199) ||
    inRange(c, 1400, 2099) ||
    (inRange(c, 3000, 3399) && c !== 3300) ||
    (inRange(c, 3410, 3999) && c !== 3782) ||
    inRange(c, 4000, 4999)
  );
}

export function isDanskeBankSweden(c: number): boolean {
  return inRange(c, 1200, 1399) || inRange(c, 2400, 2499) || inRange(c, 9180, 9189);
}

export function isLansforsakringarBank(c: number): boolean {
  return inRange(c, 3400, 3409) || inRange(c, 9020, 9029) || inRange(c, 9060, 9069);
}

export function isIcaBanken(c: number): boolean {
  return inRange(c, 9270, 9279);
}
export function isSkandiabanken(c: number): boolean {
  return inRange(c, 9150, 9169);
}
export function isSBABBank(c: number): boolean {
  return inRange(c, 9250, 9259);
}
export function isSverigesRiksbank(c: number): boolean {
  return inRange(c, 1000, 1099);
}
export function isAvanzaBank(c: number): boolean {
  return inRange(c, 9550, 9569);
}
export function isAionBank(c: number): boolean {
  return inRange(c, 9580, 9589);
}
export function isBnpParibas(c: number): boolean {
  return inRange(c, 9470, 9479);
}
export function isCitibankEurope(c: number): boolean {
  return inRange(c, 9040, 9049);
}
export function isHSBBank(c: number): boolean {
  return inRange(c, 9050, 9059);
}
export function isCalyonBank(c: number): boolean {
  return inRange(c, 9080, 9089);
}
export function isRoyalBankOfScotland(c: number): boolean {
  return inRange(c, 9090, 9099);
}
export function isDNBSweden(c: number): boolean {
  return inRange(c, 9190, 9199);
}
export function isEkobanken(c: number): boolean {
  return inRange(c, 9700, 9709);
}
export function isEnityBankGroup(c: number): boolean {
  return inRange(c, 9680, 9689);
}
export function isEpBank(c: number): boolean {
  return inRange(c, 9590, 9599);
}
export function isIkanoBank(c: number): boolean {
  return inRange(c, 9170, 9179);
}
export function isJAKMedlemsbank(c: number): boolean {
  return inRange(c, 9670, 9679);
}
export function isKlarnaBank(c: number): boolean {
  return inRange(c, 9780, 9789);
}
export function isLandshypotekBank(c: number): boolean {
  return inRange(c, 9390, 9399);
}
export function isLunarBank(c: number): boolean {
  return inRange(c, 9710, 9719);
}
export function isLanOchSparBank(c: number): boolean {
  return inRange(c, 9630, 9639);
}
export function isMarginalenBank(c: number): boolean {
  return inRange(c, 9230, 9239);
}
export function isMultitudeBank(c: number): boolean {
  return inRange(c, 9070, 9079);
}
export function isNobaBankGroup(c: number): boolean {
  return inRange(c, 9640, 9649);
}
export function isNordeaPlusgirot(c: number): boolean {
  return inRange(c, 9500, 9549) || inRange(c, 9960, 9969);
}
export function isNordnetBank(c: number): boolean {
  return inRange(c, 9100, 9109);
}
export function isNorthmillBank(c: number): boolean {
  return inRange(c, 9750, 9759);
}
export function isResursBank(c: number): boolean {
  return inRange(c, 9280, 9289);
}
export function isSantander(c: number): boolean {
  return inRange(c, 9460, 9469);
}
export function isSparbankenSyd(c: number): boolean {
  return inRange(c, 9570, 9579);
}
export function isSwedbank7DigitsAccountNumber(c: number): boolean {
  return inRange(c, 7000, 7999);
}
export function isSwedbank10DigitsAccountNumber(c: number): boolean {
  return inRange(c, 8000, 8999) || inRange(c, 9300, 9349);
}
export function isSveaBank(c: number): boolean {
  return inRange(c, 9660, 9669);
}
export function isAlandsbanken(c: number): boolean {
  return inRange(c, 2300, 2399);
}
export function isVolvofinansBank(c: number): boolean {
  return inRange(c, 9610, 9619);
}
export function isStadshypotekBank(c: number): boolean {
  return inRange(c, 9200, 9209);
}
export function isGjensidigeNorSparebank(c: number): boolean {
  return inRange(c, 9260, 9269);
}
export function isParetoOhman(c: number): boolean {
  return inRange(c, 9380, 9389);
}
export function isForex(c: number): boolean {
  return inRange(c, 9400, 9449);
}
export function isParexBank(c: number): boolean {
  return inRange(c, 9480, 9489);
}
export function isBriteAb(c: number): boolean {
  return inRange(c, 9490, 9499);
}
export function isBankingCircle(c: number): boolean {
  return inRange(c, 9600, 9609);
}
export function isBankOfChinaLuxembourg(c: number): boolean {
  return inRange(c, 9620, 9629);
}
export function isMedMeraBank(c: number): boolean {
  return inRange(c, 9650, 9659);
}
export function isFolkia(c: number): boolean {
  return inRange(c, 9690, 9699);
}
export function isNetfondsBank(c: number): boolean {
  return inRange(c, 9720, 9729);
}
export function isNasdaqOmx(c: number): boolean {
  return inRange(c, 9870, 9879);
}
export function isRiksgalden(c: number): boolean {
  return inRange(c, 9880, 9889);
}
export function isPrivatgirot(c: number): boolean {
  return inRange(c, 9860, 9869);
}
export function isIntergiro(c: number): boolean {
  return inRange(c, 9770, 9779);
}
export function isNykredit(c: number): boolean {
  return c === 9950;
}
export function isTellerBranchNorway(c: number): boolean {
  return c === 9951;
}
export function isBankernasAutomatbolag(c: number): boolean {
  return c === 9952;
}
export function isTellerBranchSweden(c: number): boolean {
  return c === 9953;
}
export function isKortacceptNordic(c: number): boolean {
  return c === 9954;
}
export function isKommuninvest(c: number): boolean {
  return c === 9955;
}
export function isVpSecurities(c: number): boolean {
  return c === 9956;
}

export interface BankResolution {
  bank: SwedishBank | null;
  bankName: string | null;
}

export function resolveBank(clearing4: number): BankResolution {
  if (isNordeaPersonkonto(clearing4))
    return { bank: SwedishBank.NordeaPersonkonto, bankName: "Nordea Personkonto" };
  if (isSverigesRiksbank(clearing4))
    return { bank: SwedishBank.SverigesRiksbank, bankName: "Sveriges riksbank" };
  if (isAvanzaBank(clearing4)) return { bank: SwedishBank.AvanzaBank, bankName: "Avanza Bank" };
  if (isAionBank(clearing4)) return { bank: SwedishBank.AionBank, bankName: "AION Bank" };
  if (isBnpParibas(clearing4))
    return { bank: SwedishBank.BnpParibas, bankName: "BNP Paribas S.A. Bankfilial Sverige" };
  if (isCitibankEurope(clearing4))
    return { bank: SwedishBank.CitibankEurope, bankName: "Citibank Europe plc" };
  if (isHSBBank(clearing4)) return { bank: SwedishBank.HSBBank, bankName: "HSB Bank" };
  if (isCalyonBank(clearing4)) return { bank: SwedishBank.CalyonBank, bankName: "Calyon Bank" };
  if (isRoyalBankOfScotland(clearing4))
    return { bank: SwedishBank.RoyalBankOfScotland, bankName: "Royal Bank of Scotland" };
  if (isDanskeBankSweden(clearing4))
    return { bank: SwedishBank.DanskeBank, bankName: "Danske Bank" };
  if (isDNBSweden(clearing4)) return { bank: SwedishBank.DNBSverige, bankName: "DNB Sverige" };
  if (isEkobanken(clearing4)) return { bank: SwedishBank.Ekobanken, bankName: "Ekobanken" };
  if (isEnityBankGroup(clearing4))
    return { bank: SwedishBank.EnityBankGroup, bankName: "Enity Bank Group" };
  if (isEpBank(clearing4)) return { bank: SwedishBank.EpBank, bankName: "EP Bank" };
  if (isHandelsbanken(clearing4))
    return { bank: SwedishBank.Handelsbanken, bankName: "Handelsbanken" };
  if (isIcaBanken(clearing4)) return { bank: SwedishBank.IcaBanken, bankName: "ICA Banken" };
  if (isIkanoBank(clearing4)) return { bank: SwedishBank.IkanoBank, bankName: "Ikano Bank" };
  if (isJAKMedlemsbank(clearing4))
    return { bank: SwedishBank.JAKMedlemsbank, bankName: "JAK Medlemsbank" };
  if (isKlarnaBank(clearing4)) return { bank: SwedishBank.KlarnaBank, bankName: "Klarna Bank" };
  if (isLandshypotekBank(clearing4))
    return { bank: SwedishBank.LandshypotekBank, bankName: "Landshypotek Bank" };
  if (isLunarBank(clearing4)) return { bank: SwedishBank.LunarBank, bankName: "Lunar Bank" };
  if (isLansforsakringarBank(clearing4))
    return { bank: SwedishBank.Lansforsakringar, bankName: "Länsförsäkringar Bank" };
  if (isLanOchSparBank(clearing4))
    return { bank: SwedishBank.LanOchSparBank, bankName: "Lån & Spar Bank" };
  if (isMarginalenBank(clearing4))
    return { bank: SwedishBank.MarginalenBank, bankName: "Marginalen Bank" };
  if (isMultitudeBank(clearing4))
    return { bank: SwedishBank.MultitudeBank, bankName: "Multitude Bank" };
  if (isNobaBankGroup(clearing4))
    return { bank: SwedishBank.NobaBankGroup, bankName: "Noba Bank Group" };
  if (isNordeaPlusgirot(clearing4))
    return { bank: SwedishBank.NordeaPlusgirot, bankName: "Nordea (Plusgirot)" };
  if (isNordeaOrdinary(clearing4)) return { bank: SwedishBank.Nordea, bankName: "Nordea" };
  if (isNordnetBank(clearing4)) return { bank: SwedishBank.NordnetBank, bankName: "Nordnet Bank" };
  if (isNorthmillBank(clearing4))
    return { bank: SwedishBank.NorthmillBank, bankName: "Northmill Bank" };
  if (isResursBank(clearing4)) return { bank: SwedishBank.ResursBank, bankName: "Resurs Bank" };
  if (isSantander(clearing4)) return { bank: SwedishBank.Santander, bankName: "Santander" };
  if (isSBABBank(clearing4)) return { bank: SwedishBank.SBABBank, bankName: "SBAB Bank" };
  if (isSEB(clearing4)) return { bank: SwedishBank.SEB, bankName: "SEB" };
  if (isSkandiabanken(clearing4))
    return { bank: SwedishBank.Skandiabanken, bankName: "Skandiabanken" };
  if (isSparbankenSyd(clearing4))
    return { bank: SwedishBank.SparbankenSyd, bankName: "Sparbanken Syd" };
  if (isSwedbank7DigitsAccountNumber(clearing4) || isSwedbank10DigitsAccountNumber(clearing4))
    return { bank: SwedishBank.Swedbank, bankName: "Swedbank" };
  if (isSveaBank(clearing4)) return { bank: SwedishBank.SveaBank, bankName: "Svea Bank" };
  if (isAlandsbanken(clearing4))
    return { bank: SwedishBank.Alandsbanken, bankName: "Ålandsbanken Abp (Finland) svensk filial" };
  if (isVolvofinansBank(clearing4))
    return { bank: SwedishBank.VolvofinansBank, bankName: "Volvofinans Bank" };
  if (isStadshypotekBank(clearing4))
    return { bank: SwedishBank.StadshypotekBank, bankName: "Stadshypotek Bank" };
  if (isGjensidigeNorSparebank(clearing4))
    return { bank: SwedishBank.GjensidigeNorSparebank, bankName: "Gjensidige NOR Sparebank" };
  if (isParetoOhman(clearing4)) return { bank: SwedishBank.ParetoOhman, bankName: "Pareto Öhman" };
  if (isForex(clearing4)) return { bank: SwedishBank.Forex, bankName: "Forex" };
  if (isParexBank(clearing4)) return { bank: SwedishBank.ParexBank, bankName: "Parex Bank" };
  if (isBriteAb(clearing4)) return { bank: SwedishBank.BriteAb, bankName: "Brite AB" };
  if (isBankingCircle(clearing4))
    return { bank: SwedishBank.BankingCircle, bankName: "Banking Circle" };
  if (isBankOfChinaLuxembourg(clearing4))
    return { bank: SwedishBank.BankOfChinaLuxembourg, bankName: "Bank of China (Luxembourg)" };
  if (isMedMeraBank(clearing4)) return { bank: SwedishBank.MedMeraBank, bankName: "MedMera Bank" };
  if (isFolkia(clearing4)) return { bank: SwedishBank.Folkia, bankName: "Folkia" };
  if (isNetfondsBank(clearing4))
    return { bank: SwedishBank.NetfondsBank, bankName: "Netfonds Bank" };
  if (isNasdaqOmx(clearing4)) return { bank: SwedishBank.NasdaqOmx, bankName: "Nasdaq-OMX" };
  if (isRiksgalden(clearing4)) return { bank: SwedishBank.Riksgalden, bankName: "Riksgälden" };
  if (isPrivatgirot(clearing4)) return { bank: SwedishBank.Privatgirot, bankName: "Privatgirot" };
  if (isIntergiro(clearing4)) return { bank: SwedishBank.Intergiro, bankName: "Intergiro" };
  if (isNykredit(clearing4)) return { bank: SwedishBank.Nykredit, bankName: "Nykredit" };
  if (isTellerBranchNorway(clearing4))
    return { bank: SwedishBank.TellerBranchNorway, bankName: "Teller Branch Norway" };
  if (isBankernasAutomatbolag(clearing4))
    return { bank: SwedishBank.BankernasAutomatbolag, bankName: "Bankernas Automatbolag" };
  if (isTellerBranchSweden(clearing4))
    return { bank: SwedishBank.TellerBranchSweden, bankName: "Teller Branch Sweden" };
  if (isKortacceptNordic(clearing4))
    return { bank: SwedishBank.KortacceptNordic, bankName: "Kortaccept Nordic" };
  if (isKommuninvest(clearing4))
    return { bank: SwedishBank.Kommuninvest, bankName: "Kommuninvest" };
  if (isVpSecurities(clearing4))
    return { bank: SwedishBank.VpSecurities, bankName: "VP Securities" };

  return { bank: null, bankName: null };
}
