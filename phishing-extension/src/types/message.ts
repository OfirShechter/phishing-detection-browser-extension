export enum MessageType {
    CHECK_PHISHING = 'CHECK_PHISHING',
}

export type Message = {
    type: MessageType;
    url: string;
}