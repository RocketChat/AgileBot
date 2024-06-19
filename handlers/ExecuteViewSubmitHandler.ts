import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { AgileBotApp } from '../AgileBotApp';
import { sendNotification } from '../lib/messages';
import { storeOrUpdateData } from '../lib/PersistenceMethods';
import { getInteractionRoomData } from '../lib/roomInteraction';

export class ExecuteViewSubmitHandler {
    constructor(
        private readonly app: AgileBotApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence,
    ) {}

    public async run(context: UIKitViewSubmitInteractionContext) {
        const { user, view } = context.getInteractionData();

        if (!user) {
            return {
                success: false,
                error: 'No user found',
            };
        }

        const modalId = view.id;

        switch (modalId) {
            case 'promptModalId':
                return await this.handlePromptModal(context);
            case 'meetingModalId':
                return this.handleMeetingModal(context);
            default:
                return {
                    success: false,
                    error: 'Unknown modal ID',
                };
        }
    }

    private async handlePromptModal(context: UIKitViewSubmitInteractionContext) {
        const { user, view } = context.getInteractionData();

        const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), user.id);

        if (!roomId) {
            return {
                success: false,
                error: 'No room to send a message',
            };
        }

        let room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        const agileMessage = view.state?.['agileMessage']['agileMessage'] || '';
        const selectDays = view.state?.['selectDays']['selectDays'] || '';
        const time = view.state?.['agileTime']['agileTime'] || '';

        await sendNotification(
            this.read,
            this.modify,
            user,
            room,
            `**Settings saved successfully.** \n Selected days: ${selectDays} \n Time: ${time} UTC`,
        );

        await storeOrUpdateData(this.persistence, this.read, roomId, 'agile_message', agileMessage);
        await storeOrUpdateData(this.persistence, this.read, roomId, 'agile_days', selectDays);
        await storeOrUpdateData(this.persistence, this.read, roomId, 'agile_time', time);

        return {
            success: true,
            ...view,
        };
    }

    private handleMeetingModal(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();
        console.log('Hello from meetingModalId');
        return {
            success: true,
			...view,
        };
    }
}
