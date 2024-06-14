import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
    ISlashCommand,
    SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IAgileSettingsPersistenceData } from '../definitions/agile-settings/ExecutorProps';

export class ThreadInit implements ISlashCommand {
    public command = 'scrum';
    public i18nParamsExample: string = 'agile_scrum_init';
    public i18nDescription: string = 'agile_scrum_init_description';
    public providesPreview: boolean = false;
   
    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const author = context.getSender();
        const user = await read.getUserReader().getAppUser();
        const room: IRoom = context.getRoom();
        let message = "";

        const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id);
        const data = (await read.getPersistenceReader().readByAssociation(assoc)) as IAgileSettingsPersistenceData[];
        if (data && data.length > 0) {
            message = data[0].agile_message;
        }

        await this.sendMessageToRoom(room, modify, user ?? author, message);
    }
   
    private async sendMessageToRoom(room: IRoom, modify: IModify, sender: IUser, message: string): Promise<void> {
        const messageBuilder = modify.getCreator().startMessage();
        messageBuilder.setText(message);
        messageBuilder.setRoom(room);
        messageBuilder.setSender(sender);
        await modify.getCreator().finish(messageBuilder);
    }
}
