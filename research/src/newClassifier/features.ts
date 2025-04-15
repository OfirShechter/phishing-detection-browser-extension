import { encode } from "gpt-tokenizer/model/gpt-3.5-turbo";
import { TokensToNumber } from "./tokensToNumber";

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
  hasAtSymbol: boolean;
  hasDoubleSlash: boolean;
  hasHyphen: boolean;
}

function extractUrlFeaturesObject(url: string): UrlFeatures {
  try {
    const parsed = new URL(url);
    const hostnameParts = parsed.hostname.split(".");
    const domain = hostnameParts.slice(-2, -1)[0] || "";
    const tld = hostnameParts.slice(-1)[0] || "";
    const subdomains = hostnameParts.slice(0, -2);

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
      hasAtSymbol: url.includes("@"),
      hasDoubleSlash: url.includes("//", 8),
      hasHyphen: parsed.hostname.includes("-"),
    };
  } catch (e) {
    console.error("Invalid URL:", url);
    throw e;
  }
}

const domainTokensToNumber = new TokensToNumber({linear_weight: [[1]], linear_bias: [1]});
const tldTokensToNumber = new TokensToNumber({linear_weight: [[1]], linear_bias: [1]});
const pathTokensToNumber = new TokensToNumber({linear_weight: [[1]], linear_bias: [1]});
const queryTokensToNumber = new TokensToNumber({linear_weight: [[1]], linear_bias: [1]});
const subdomainTokensToNumber = new TokensToNumber({linear_weight: [[1]], linear_bias: [1]});

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
    stringToNumber(features.path ?? "", pathTokensToNumber.forward.bind(pathTokensToNumber)), // path emmbedded value
    stringToNumber(features.query ?? "", queryTokensToNumber.forward.bind(queryTokensToNumber)), // query emmbedded value
    features.port ? 1 : 0,
    features.path.length,
    features.query.length,
    features.urlLength,
    features.hasAtSymbol ? 1 : 0,
    features.hasDoubleSlash ? 1 : 0,
    features.hasHyphen ? 1 : 0,
  ];
}

export function extractUrlFeatures(url: string): number[] {
  const features = extractUrlFeaturesObject(url);
  console.log("Extracted Features:", features);
  return feturesObjectToArray(features);
}
