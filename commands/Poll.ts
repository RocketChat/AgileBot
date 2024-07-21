import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { sendMessageToRoom } from '../lib/SendMessageToRoom';

function generateUUID(): string {
    function randomHex(size: number): string {
        return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    return [
        randomHex(8),
        randomHex(4),
        '4' + randomHex(3),
        ((Math.floor(Math.random() * 4) + 8).toString(16)) + randomHex(3),
        randomHex(12)
    ].join('-');
}

interface PollData {
    time: string;
    message: string;
    uuid: string;
    roomId: string;
    creatorName: string;
    responses: {
        yes: string[];
        no: string[];
    };
}

export class QuickPoll implements ISlashCommand {
    public command = 'quickpoll';
    public i18nParamsExample: string = 'quick_poll_examples';
    public i18nDescription: string = 'quick_poll_description';
    public providesPreview: boolean = false;

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const author = context.getSender();
        const user = await read.getUserReader().getAppUser();
        const room: IRoom = context.getRoom();

        const args = context.getArguments();

        if (args.length < 2) {
            await sendMessageToRoom(room, modify, user ?? author, 'Please provide both time and message arguments.');
            return;
        }

        const time = args[0];
        const message = args.slice(1).join(' ');

        const uuid = generateUUID();

        const pollData: PollData = {
            time,
            message,
            uuid,
            roomId: room.id,
            creatorName: author.name,
            responses: {
                yes: [],
                no: []
            }
        };

        const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid);
        await persis.createWithAssociation(pollData, assoc);

        const blockBuilder = modify.getCreator().getBlockBuilder();

        blockBuilder.addSectionBlock({
            text: blockBuilder.newMarkdownTextObject(`Time: ${time}\nMessage: ${message}\nUUID: ${uuid}\nCreated by: ${author.name}`),
        });

        blockBuilder.addActionsBlock({
            elements: [
                blockBuilder.newButtonElement({
                    text: blockBuilder.newPlainTextObject('Yes'),
                    actionId: 'quickpoll_yes',
                    value: `${uuid}`,
                }),
                blockBuilder.newButtonElement({
                    text: blockBuilder.newPlainTextObject('No'),
                    actionId: 'quickpoll_no',
                    value: `${uuid}`,
                }),
            ],
        });

        const builder = modify
            .getCreator()
            .startMessage()
            .setSender(user ?? author)
            .setRoom(room)
            .setBlocks(blockBuilder.getBlocks());

        await modify.getCreator().finish(builder);

        const when = new Date();
        when.setSeconds(when.getSeconds() + parseInt(time, 10));

        const job = {
            id: `quick-poll`,
            when,
            data: { uuid },
        };

        await modify.getScheduler().scheduleOnce(job);
    }
}
