import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { AgileBotApp } from '../AgileBotApp';
import { CommandUtility } from '../lib/CommandUtility';

export class MeetingReminder implements ISlashCommand {
	public constructor(private readonly app: AgileBotApp) {}
	public command = 'meeting-reminder';
	public i18nDescription = 'meeting_reminder_description';
	public providesPreview = false;
	public i18nParamsExample = '';

	public async executor(
		context: SlashCommandContext,
		read: IRead,
		modify: IModify,
		http: IHttp,
		persistence: IPersistence,
	): Promise<void> {
		const command = context.getArguments();
		const sender = context.getSender();
		const room = context.getRoom();

		if (!Array.isArray(command)) {
			return;
		}

		const commandUtility = new CommandUtility({
			sender: sender,
			room: room,
			command: command,
			context: context,
			read: read,
			modify: modify,
			http: http,
			persistence: persistence,
			app: this.app,
		});

		commandUtility.openMeetingReminderModal();
	}
}
