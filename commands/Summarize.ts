import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export class SummarizeCommand implements ISlashCommand {
    public command = "summarize";
    public i18nParamsExample = "Thread report for Agile";
    public i18nDescription = "";
    public providesPreview = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const user = context.getSender();
        const author = await read.getUserReader().getAppUser();
        const room = context.getRoom();
        const threadId = context.getThreadId();

        if (!threadId) {
            await this.notifyMessage(
                room,
                read,
                context.getSender(),
                "You can only call /summarize in a thread"
            );
            throw new Error("You can only call /summarize in a thread");
        }

        const messages = await this.getThreadMessages(
            room,
            read,
            context.getSender(),
            threadId
        );

        const notPosted = await this.getNotPosted(
            room,
            read,
            context.getSender(),
            threadId
        )

        const summary = await this.summarizeMessages(
            room,
            read,
            context.getSender(),
            http,
            messages,
            notPosted
        );

        await this.sendMessage(room, summary, author ?? user, modify, threadId);
    }

    private async summarizeMessages(
        room: IRoom,
        read: IRead,
        user: IUser,
        http: IHttp,
        messages: string,
        notPosted: string,
    ): Promise<string> {
        const url = "http://llama3-70b/v1"
        const model = "llama3"

        const body = {
            model,
            messages: [
                {
                    role: "system",
                    content: `You are an assistant designed to help summarize daily updates from engineers. Follow this format:
                
                ### (Name of engineer)
                [Leave one line]
                    ** Progress **: [Brief summary of what was completed]
                    ** Blockers **: [Brief summary of any issues]
                    ** Next Steps **: [Brief summary of planned tasks]

                Briefly summarize the following messages only, separated by double slashes (//): ${messages}
                
                Mention these people who haven't posted an update. If empty, say "Everyone posted an update!": ${notPosted}
                `,
                },
            ],
            temperature: 0,
        };

        const response = await http.post(url + "/chat/completions", {
            headers: {
                "Content-Type": "application/json",
            },
            content: JSON.stringify(body),
        });

        if (!response.content) {
            await this.notifyMessage(
                room,
                read,
                user,
                "Something is wrong with AI. Please try again later"
            );
            throw new Error(
                "Something is wrong with AI. Please try again later"
            );
        }

        return JSON.parse(response.content).choices[0].message.content;
    }

    private async getThreadMessages(
        room: IRoom,
        read: IRead,
        user: IUser,
        threadId: string
    ) {
        const threadReader = read.getThreadReader();
        const thread = await threadReader.getThreadById(threadId);

        if (!thread) {
            await this.notifyMessage(room, read, user, "Thread not found");
            throw new Error("Thread not found");
        }

        const messageTexts: string[] = [];
        for (const message of thread) {
            if (message.text) {
                messageTexts.push(`${message.sender.name}: ${message.text}`);
            }
        }

        messageTexts.shift();
        return messageTexts.join(" // ");
    }

    private async getNotPosted(
        room: IRoom,
        read: IRead,
        user: IUser,
        threadId: string
    ) {
        const threadReader = read.getThreadReader();
        const thread = await threadReader.getThreadById(threadId);
    
        if (!thread) {
            await this.notifyMessage(room, read, user, "Thread not found");
            throw new Error("Thread not found");
        }
    
        const usersInRoom = await read.getRoomReader().getMembers(room.id);
    
        const usernamesInRoom = usersInRoom.map(user => user.name);
    
        const usersWhoPosted = new Set<string>();
        for (const message of thread) {
            if (message.sender && message.sender.name) {
                usersWhoPosted.add(message.sender.name);
            }
        }
    
        const usersNotPosted = usernamesInRoom.filter(name => !usersWhoPosted.has(name));

        return usersNotPosted.join("--");
    }
    
    private async sendMessage(
        room: IRoom, 
        textMessage: string, 
        author: IUser, 
        modify: IModify, 
        threadId? : string): Promise<string> {
        const messageBuilder = modify.getCreator().startMessage({
            text: textMessage,
        } as IMessage);
        messageBuilder.setRoom(room);
        messageBuilder.setSender(author);
        if (threadId){
            messageBuilder.setThreadId(threadId);
        }
        return modify.getCreator().finish(messageBuilder);
    }

    private async notifyMessage(
        room: IRoom,
        read: IRead,
        user: IUser,
        message: string,
        threadId?: string
    ): Promise<void> {
        const notifier = read.getNotifier();

        const messageBuilder = notifier.getMessageBuilder();
        messageBuilder.setText(message);
        messageBuilder.setRoom(room);

        if (threadId) {
            messageBuilder.setThreadId(threadId);
        }

        return notifier.notifyUser(user, messageBuilder.getMessage());
    }
}