enum MessageType {
    CHECK_PHISHING = 'CHECK_PHISHING',
}

type Message = {
    type: MessageType;
    url: string;
}