import {encode} from "gpt-tokenizer/model/gpt-3.5-turbo";

export interface UrlFeatures {
    protocol: string;
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
      const hostnameParts = parsed.hostname.split('.');
      const domain = hostnameParts.slice(-2, -1)[0] || '';
      const tld = hostnameParts.slice(-1)[0] || '';
      const subdomains = hostnameParts.slice(0,-2);
  
      return {
        protocol: parsed.protocol.replace(':', ''),
        hasAuth: parsed.username !== '' || parsed.password !== '',
        subdomains,
        domain,
        tld,
        port: parsed.port ? true : false,
        path: parsed.pathname,
        query: parsed.search,
        pathLength: parsed.pathname.length,
        queryLength: parsed.search.length,
        urlLength: url.length,
        hasAtSymbol: url.includes('@'),
        hasDoubleSlash: url.includes('//', 8),
        hasHyphen: parsed.hostname.includes('-'),
      };
    } catch (e) {
      console.error("Invalid URL:", url);
      throw e;
    }
  }
  
  function stringToNumber(str: string): number {
    const tokens = encode(str);
    const sum = tokens.reduce((acc, token) => acc + token, 0);
    return tokens.length ? sum / tokens.length : 0;
  }

function feturesObjectToArray(features: UrlFeatures): number[] {
    const subDomainsAsNumber = features.subdomains.length ? features.subdomains.reduce((total_val, subdomain) => {
        const subdomain_val = stringToNumber(subdomain);
        return total_val + subdomain_val;
    }, 0) / features.subdomains.length : 0;

    const domainNum = stringToNumber(features.domain);
    return [
      features.protocol === 'https' ? 1 : 0, // protocol
      features.hasAuth ? 1 : 0, // hasAuth
      subDomainsAsNumber, // subdomains emmbedded value
      stringToNumber(features.domain), // domain emmbedded value
      stringToNumber(features.tld), // tld emmbedded value
      stringToNumber(features.path ?? ''), // path emmbedded value
      stringToNumber(features.query ?? ''), // query emmbedded value
      features.port ? 1 : 0,
      features.path.length,
      features.query.length,
      features.pathLength / features.urlLength,
      features.queryLength / features.urlLength,
      features.urlLength / (features.pathLength + features.queryLength),
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