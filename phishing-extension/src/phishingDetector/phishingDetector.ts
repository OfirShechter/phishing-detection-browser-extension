import { urlTypePredict } from "./urlTypePredict";

export function isPhishingSite(url: string): boolean {
    return urlTypePredict(url);
  }
  