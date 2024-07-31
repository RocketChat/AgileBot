import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

export const sendMessageToRoom = async (room: IRoom, modify: IModify, sender: IUser, message: string): Promise<string> => {
	const messageBuilder = modify.getCreator().startMessage();
	messageBuilder.setText(message);
	messageBuilder.setRoom(room);
	messageBuilder.setSender(sender);
	const messageId = await modify.getCreator().finish(messageBuilder);
	return messageId;
};
