export interface IPollData {
    time: string;
    message: string;
    uuid: string;
    roomId: string;
    messageId: string;
    pollMessage: string;
    creatorId: string;
    creatorName: string;
    responses: {
        yes: string[];
        no: string[];
    };
}
