const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertLessThanThousand(num: number): string {
  let result = "";
  if (num >= 100) {
    result += ONES[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    result += TENS[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    result += ONES[num] + " ";
  }
  return result.trim();
}

/**
 * Converts a numeric amount to words in Indian/International numbering format.
 * E.g., 25000 -> "Twenty Five Thousand Rupees Only"
 */
export function numberToWords(amount: number, currencyName: string = "Rupees"): string {
  if (!amount || amount === 0) return `Zero ${currencyName} Only`;

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let num = integerPart;
  let str = "";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  if (crore > 0) str += convertLessThanThousand(crore) + " Crore ";
  if (lakh > 0) str += convertLessThanThousand(lakh) + " Lakh ";
  if (thousand > 0) str += convertLessThanThousand(thousand) + " Thousand ";
  if (remainder > 0) str += convertLessThanThousand(remainder) + " ";

  str = str.trim() + ` ${currencyName}`;

  if (decimalPart > 0) {
    str += ` and ${convertLessThanThousand(decimalPart)} Paise`;
  }

  return str.trim() + " Only";
}
