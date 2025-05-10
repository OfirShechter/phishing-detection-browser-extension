import { PhishingStatus } from "./state.type";

export enum MessageType {
    CHECK_LEGITIMATE_BY_URL = 'CHECK_LEGITIMATE_BY_URL',
    CHECK_PHISHING_BY_DOM = 'CHECK_PHISHING_BY_DOM',
    GET_PHISHING_STATUS = 'GET_PHISHING_STATUS',
    PHISHING_STATUS_UPDATED = 'PHISHING_STATUS_UPDATED',
    EXTENTION_INITIALIZED = 'EXTENTION_INITIALIZED',
    TOGGLE_BANNER = 'TOGGLE_BANNER',
    ABORT_CHECK_LEGITIMATE_BY_URL = 'ABORT_CHECK_LEGITIMATE_BY_URL',
}

export type Message = {
    type: MessageType;
    url?: string;
    enableBanner?: boolean;
    phishingStatus?: PhishingStatus;
    domFeatures?: number[];
}