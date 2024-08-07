import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';

export class DailyStandupProcessor implements IProcessor {
    public id = 'daily-standup-processor';

    public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
        const { roomId, message } = jobContext.data as { roomId: string, message: string };

        const sender = await read.getUserReader().getAppUser();
        const room = await read.getRoomReader().getById(roomId);

        try {
            if (room && sender) {
                const messageBuilder = modify.getCreator().startMessage();
                messageBuilder.setText(message);
                messageBuilder.setRoom(room);
                messageBuilder.setSender(sender);
                await modify.getCreator().finish(messageBuilder);
            }
        } catch (error) {
            console.error('Error sending standup message:', error);
        }
    }
}
