export enum MessageType {
    CHECK_PHISHING = 'CHECK_PHISHING',
    GET_PHISHING_STATUS = 'GET_PHISHING_STATUS',
    TOGGLE_BANNER = 'TOGGLE_BANNER',
}

export type Message = {
    type: MessageType;
    url?: string;
    enableBanner?: boolean;
}