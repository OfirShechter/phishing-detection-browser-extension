export enum MessageType {
    CHECK_PHISHING = 'CHECK_PHISHING',
    GET_PHISHING_STATUS = 'GET_PHISHING_STATUS',
}

export type Message = {
    type: MessageType;
    url: string;
}