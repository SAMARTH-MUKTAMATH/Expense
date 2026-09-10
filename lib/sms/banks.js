export const BANK_ENTITY_CODES = {
  HDFC: ["HDFCBK", "HDFCBN"],
  SBI: ["SBIUPI", "SBIINB", "SBIBNK", "SBICRD", "ATMSBI"],
  ICICI: ["ICICIB", "ICICIT"],
  AXIS: ["AXISBK", "AXISBN"],
  KOTAK: ["KOTAKB", "KMBLNK"],
  PNB: ["PNBSMS", "PNBBNK"],
  BOB: ["BOBTXN", "BOBSMS", "BOBIND"],
  CANARA: ["CANBNK"],
  UNION: ["UNIONB", "UNIONBK"],
  IDFC: ["IDFCB", "IDFCFB", "IDFCBK"],
  YES: ["YESBNK"],
  INDUSIND: ["INDUSB"],
  FEDERAL: ["FEDBNK"],
  RBL: ["RBLBNK"],
  AU: ["AUBANK"],
  IDBI: ["IDBIBK"],
  PAYTM: ["PYTMBK", "PAYTMB"],
  UTKARSH: ["UTKSPR", "UTKARSH"],
  BOI: ["BOIIND"],
  INDIAN: ["INDBNK"],
  IOB: ["IOBCHN"],
  UCO: ["UCOBNK"],
  CENTRAL: ["CBIIND"],
  MAHARASHTRA: ["MAHABK"],
  JK: ["JKBANK"],
  KARURVYSYA: ["KVBANK"],
  CITYUNION: ["CUBANK"],
  SOUTHINDIAN: ["SIBANK"],
  DCB: ["DCBBNK"],
  BANDHAN: ["BANDHN"],
  EQUITAS: ["EQUTAS"],
  UJJIVAN: ["UJJIVN"],
  AIRTEL: ["AIRBNK"],
  FINO: ["FINOBK"],
};

const BANK_CODE_PREFIXES = [
  ["HDFC", "HDFC"], ["ICICI", "ICICI"], ["AXIS", "AXIS"], ["KOTAK", "KOTAK"],
  ["IDFC", "IDFC"], ["SBI", "SBI"], ["PNB", "PNB"], ["BOB", "BOB"],
  ["CANBNK", "CANARA"], ["CAN", "CANARA"], ["UNION", "UNION"], ["YES", "YES"],
  ["INDUS", "INDUSIND"], ["FED", "FEDERAL"], ["RBL", "RBL"], ["IDBI", "IDBI"],
  ["UTK", "UTKARSH"], ["BANDH", "BANDHAN"], ["EQU", "EQUITAS"], ["UJJIV", "UJJIVAN"],
  ["PYTM", "PAYTM"], ["PAYTM", "PAYTM"], ["AUBANK", "AU"],
];

const CODE_TO_BANK = new Map();
for (const [bank, codes] of Object.entries(BANK_ENTITY_CODES)) {
  for (const code of codes) CODE_TO_BANK.set(code, bank);
}

export function normalizeSenderId(sender) {
  if (typeof sender !== "string") return "";
  const parts = sender.trim().toUpperCase().split("-").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length >= 2 && parts[0].length <= 2) return parts[1];
  return parts[0];
}

export function identifyBank(sender) {
  const code = normalizeSenderId(sender);
  if (!code) return null;

  const exact = CODE_TO_BANK.get(code);
  if (exact) return exact;

  let best = null;
  for (const [prefix, bank] of BANK_CODE_PREFIXES) {
    if (code.startsWith(prefix) && (!best || prefix.length > best.length)) {
      best = { bank, length: prefix.length };
    }
  }
  return best ? best.bank : null;
}

const DLT_SHAPE = /^[A-Z]{2}-[A-Z0-9]{4,9}$/;
const BARE_CODE_SHAPE = /^[A-Z0-9]{4,9}$/;

export function isLikelyBankSender(sender) {
  if (typeof sender !== "string") return false;
  const raw = sender.trim().toUpperCase();
  if (!raw) return false;
  if (/^\+?[\d\s()-]+$/.test(raw)) return false;
  if (identifyBank(raw)) return true;
  const withoutRouteSuffix = raw.replace(/-[A-Z]$/, "");
  return (
    DLT_SHAPE.test(withoutRouteSuffix) || BARE_CODE_SHAPE.test(withoutRouteSuffix)
  );
}
