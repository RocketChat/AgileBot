import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AgileBotApp } from '../AgileBotApp';
import { IUIKitResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { sendNotification } from '../lib/Messages';

export class ExecuteBlockActionHandler {
	constructor(
		private readonly app: AgileBotApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) {}

	public async run(context: UIKitBlockInteractionContext): Promise<IUIKitResponse> {
		const { actionId, user, container, blockId, value, triggerId, room } = context.getInteractionData();
        console.log(user);
        console.log(room);
		switch (actionId) {
			case 'quickpoll_yes': {
                if(room){
                    await sendNotification(this.read, this.modify, user, room, `${user.name} replied - Yes in room ${room.displayName}. Poll ID: ${value}`);
                }
				break;
			}
			case 'quickpoll_no':
                if(room){
                    await sendNotification(this.read, this.modify, user, room, `${user.name} replied - No in room ${room.displayName}. Poll ID: ${value}`);
                }
				break;
			default:
				console.log('Default');
		}

		return {
			success: true,
		};
	}
}
