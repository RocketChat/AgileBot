import { IJobContext, IProcessor } from "@rocket.chat/apps-engine/definition/scheduler";
import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";

export class MeetingReminderProcessor implements IProcessor {
    public id = "meeting-reminder";
    async processor (jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
        const sendMessage = async (data: IJobContext) => {
            try {
                const room = await read.getRoomReader().getById(data.room.id);
                if (room) {
                    const messageBuilder = modify.getCreator().startMessage();
                    messageBuilder.setText(data.message);
                    messageBuilder.setRoom(data.room);
                    messageBuilder.setSender(data.sender);
                    await modify.getCreator().finish(messageBuilder);
                }
            }
            catch (error) {
                console.log(error);
            }
        }
        await sendMessage(jobContext);
    }
}