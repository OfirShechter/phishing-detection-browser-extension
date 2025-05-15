import { encode } from "gpt-tokenizer/model/gpt-3.5-turbo";
import { TokensToNumber } from "./tokensToNumber";
import domainModelData from "../model/domain_model.json";
import tldModelData from "../model/tld_model.json";
import subdomainsModelData from "../model/subdomains_model.json";
import { parse } from 'tldts';


interface UrlFeatures {
  protocol: boolean; // true if https, false else (http / ftp)
  hasAuth: boolean;
  subdomains: string[];
  domain: string;
  tld: string;
  port: boolean;
  suspiciousChars: number;
  hasDoubleSlash: boolean;
  hyphenCount: number;
  numbersInSubdomains: number;
  numOfSubdomains: number;
}
// the below parameters are not used in the current implementation but can be used in the future (not used because luck of good dataset)
// path: string;
// query: string;
// pathLength: number;
// queryLength: number;
// urlLength: number;
// hasAtOrTildSymbol: boolean;
// hyphenCount: number;
// hasDomainLikePath: boolean;

function extractUrlFeaturesObject(url: string): UrlFeatures {
  try {
    const parsed = new URL(url);
    const extracted = parse(url);

    const subdomain = extracted.subdomain || '';
    const domain = extracted.domain || '';
    const tld = extracted.publicSuffix || '';
    const subdomains = subdomain ? subdomain.split('.') : [];

    // Authority construction: [username[:password]@]hostname[:port]
    let authority = '';
    if (parsed.username) authority += parsed.username;
    if (parsed.password) authority += ':' + parsed.password;
    if (parsed.username || parsed.password) authority += '@';
    if (parsed.hostname) authority += parsed.hostname;
    if (parsed.port) authority += ':' + parsed.port;

    const suspiciousChars = new Set("@~!*'();&=%#\\|^<>[]{}`");

    const suspiciousCharsCount = [...authority].filter(char => suspiciousChars.has(char)).length;

    const hasDoubleSlash = url.slice(8).includes('//'); // skip scheme (http:// or https://)

    const hyphenCount = parsed.hostname ? (parsed.hostname.match(/-/g) || []).length : 0;

    const numbersInSubdomains = subdomains.reduce((acc, sub) => {
      return acc + (sub.match(/\d/g) || []).length;
    }, 0);

    return {
      protocol: parsed.protocol === 'https:',
      hasAuth: !!parsed.username || !!parsed.password,
      subdomains: subdomains,
      domain: domain,
      tld: tld,
      port: !!parsed.port,
      suspiciousChars: suspiciousCharsCount,
      hasDoubleSlash: hasDoubleSlash,
      hyphenCount: hyphenCount,
      numbersInSubdomains: numbersInSubdomains,
      numOfSubdomains: subdomains.length,
    };
  } catch (e) {
    console.error("Invalid URL:", url);
    throw e;
  }
}

const domainTokensToNumber = new TokensToNumber(domainModelData);
const tldTokensToNumber = new TokensToNumber(tldModelData);
const subdomainTokensToNumber = new TokensToNumber(subdomainsModelData);

function stringToNumber(str: string, tokensToNumberCallback: (n: number[]) => number): number {
  const tokens = encode(str);
  return tokens.length ? tokensToNumberCallback(tokens) : 0;
}

function feturesObjectToArray(features: UrlFeatures): number[] {
  const subDomainsAsNumber = features.subdomains.length
    ? Math.max(...features.subdomains.map((subdomain) => stringToNumber(subdomain, subdomainTokensToNumber.forward.bind(subdomainTokensToNumber))))
    : 0;

  return [
    features.protocol ? 1 : 0, // protocol
    features.hasAuth ? 1 : 0, // hasAuth
    subDomainsAsNumber, // subdomains emmbedded value
    stringToNumber(features.domain, domainTokensToNumber.forward.bind(domainTokensToNumber)), // domain emmbedded value
    stringToNumber(features.tld, tldTokensToNumber.forward.bind(tldTokensToNumber)), // tld emmbedded value
    features.port ? 1 : 0,
    features.suspiciousChars,
    features.hasDoubleSlash ? 1 : 0,
    features.hyphenCount,
    features.numbersInSubdomains,
    features.numOfSubdomains,
  ];
}

export function extractUrlFeatures(url: string): number[] {
  const features = extractUrlFeaturesObject(url);
  console.log("extract URL features for", url)
  return feturesObjectToArray(features);
}
