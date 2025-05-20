import { PhishingStatus } from "./state.type";

export enum MessageType {
    CHECK_PHISHING_BY_URL = 'CHECK_PHISHING_BY_URL',
    CHECK_PHISHING_BY_DOM = 'CHECK_PHISHING_BY_DOM',
    GET_PHISHING_STATUS = 'GET_PHISHING_STATUS',
    PHISHING_STATUS_UPDATED = 'PHISHING_STATUS_UPDATED',
    TOGGLE_BANNER = 'TOGGLE_BANNER',
    FETCH_HTML = "FETCH_HTML",
    TEST = "TEST", // For grading test
}

export type Message = {
    type: MessageType;
    url?: string;
    enableBanner?: boolean;
    phishingStatus?: PhishingStatus;
    domFeatures?: number[];
    urlFeatures?: number[];
    data?: any; // For grading test
}