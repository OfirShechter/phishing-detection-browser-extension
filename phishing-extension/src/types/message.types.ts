import { PhishingStatus } from "./state.type";

export enum MessageType {
    CHECK_PHISHING = 'CHECK_PHISHING',
    GET_PHISHING_STATUS = 'GET_PHISHING_STATUS',
    PHISHING_STATUS_UPDATED = 'PHISHING_STATUS_UPDATED',
    EXTENTION_INITIALIZED = 'EXTENTION_INITIALIZED',
    TOGGLE_BANNER = 'TOGGLE_BANNER',
}

export type Message = {
    type: MessageType;
    url?: string;
    enableBanner?: boolean;
    phishingStatus?: PhishingStatus;
}