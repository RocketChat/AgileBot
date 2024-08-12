import { IJobContext } from "@rocket.chat/apps-engine/definition/scheduler";

export interface IStandupJobContext extends IJobContext {
    roomId: string;
    message: string;
}
