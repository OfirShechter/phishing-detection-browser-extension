import { encode } from "gpt-tokenizer/model/gpt-3.5-turbo";
import { TokensToNumber } from "./tokensToNumber";
import domainModelData from "../model/domain_model.json";
import tldModelData from "../model/tld_model.json";
import pathModelData from "../model/path_model.json";
import queryModelData from "../model/query_model.json";
import subdomainsModelData from "../model/subdomains_model.json";


interface UrlFeatures {
  protocol: boolean; // true if https, false else (http / ftp)
  hasAuth: boolean;
  subdomains: string[];
  domain: string;
  tld: string;
  port: boolean;
  path: string;
  query: string;
  pathLength: number;
  queryLength: number;
  urlLength: number;
  hasAtOrTildSymbol: boolean;
  hasDoubleSlash: boolean;
  hyphenCount: number;
  numbersInSubdomains: number;
  hasDomainLikePath: boolean;
  numOfSubdomains: number;
}

const domainLikePattern = /(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/;

function extractUrlFeaturesObject(url: string): UrlFeatures {
  try {
    const parsed = new URL(url);
    const hostnameParts = parsed.hostname.split(".");
    const domain = hostnameParts.slice(-2, -1)[0] || "";
    const tld = hostnameParts.slice(-1)[0] || "";
    const subdomains = hostnameParts.slice(0, -2);

    const hasDomainLikePath = domainLikePattern.test(parsed.pathname);

    return {
      protocol: parsed.protocol.replace(":", "") == "https",
      hasAuth: parsed.username !== "" || parsed.password !== "",
      subdomains,
      domain,
      tld,
      port: parsed.port ? true : false,
      path: parsed.pathname,
      query: parsed.search,
      pathLength: parsed.pathname.length,
      queryLength: parsed.search.length,
      urlLength: url.length,
      hasAtOrTildSymbol: url.includes("@") || url.includes("~"),
      hasDoubleSlash: url.includes("//", 8),
      hyphenCount: hasDomainLikePath ? (url.match(/-/g) || []).length : (parsed.hostname ? (parsed.hostname.match(/-/g) || []).length : 0),
      numbersInSubdomains: subdomains.reduce((count, part) => {
        return count + (part.match(/\d/g)?.length || 0); // Match digits and count them
      }, 0),
      hasDomainLikePath: hasDomainLikePath,
      numOfSubdomains: subdomains.length,
    };
  } catch (e) {
    console.error("Invalid URL:", url);
    throw e;
  }
}

const domainTokensToNumber = new TokensToNumber(domainModelData);
const tldTokensToNumber = new TokensToNumber(tldModelData);
// const pathTokensToNumber = new TokensToNumber(pathModelData);
// const queryTokensToNumber = new TokensToNumber(queryModelData);
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
    // stringToNumber(features.path ?? "", pathTokensToNumber.forward.bind(pathTokensToNumber)), // path emmbedded value
    // stringToNumber(features.query ?? "", queryTokensToNumber.forward.bind(queryTokensToNumber)), // query emmbedded value
    features.port ? 1 : 0,
    // features.path.length,
    // features.query.length,
    // features.urlLength,
    features.hasAtOrTildSymbol ? 1 : 0,
    features.hasDoubleSlash ? 1 : 0,
    features.hyphenCount ? 1 : 0,
    features.numbersInSubdomains,
    features.hasDomainLikePath ? 0 : 0, // bad effect on the model, so we set it to 0 for noe
    features.numOfSubdomains,
  ];
}

export function extractUrlFeatures(url: string): number[] {
  const features = extractUrlFeaturesObject(url);
  console.log("Extracted Features:", features);
  return feturesObjectToArray(features);
}
