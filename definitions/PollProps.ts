export interface IPollData {
    time: string;
    message: string;
    uuid: string;
    roomId: string;
    messageId: string;
    creatorName: string;
    responses: {
        yes: string[];
        no: string[];
    };
}
