import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AgileBotApp } from '../AgileBotApp';
import { ExecutorProps } from '../definitions/agile-settings/ExecutorProps';
import { AgileModal } from '../modals/agile-settings/AgileModal';
import { MeetingReminderModal } from '../modals/meeting-reminder/MeetingReminderModal';

export class CommandUtility {
	sender: IUser;
	room: IRoom;
	command: string[];
	context: SlashCommandContext;
	read: IRead;
	modify: IModify;
	http: IHttp;
	persistence: IPersistence;
	app: AgileBotApp;

	constructor(props: ExecutorProps) {
		this.sender = props.sender;
		this.room = props.room;
		this.command = props.command;
		this.context = props.context;
		this.read = props.read;
		this.modify = props.modify;
		this.http = props.http;
		this.persistence = props.persistence;
		this.app = props.app;
	}

	private async openModal(modalCreator: Function) {
		const triggerId = this.context.getTriggerId() as string;
		const user = this.context.getSender();

		const contextualbarBlocks = await modalCreator({
			modify: this.modify,
			read: this.read,
			persistence: this.persistence,
			http: this.http,
			slashCommandContext: this.context,
			uiKitContext: undefined,
		});
		await this.modify.getUiController().openModalView(contextualbarBlocks, { triggerId }, user);
	}

	public async openAgileSettings() {
		await this.openModal(AgileModal);
	}

	public async openMeetingReminderModal() {
		await this.openModal(MeetingReminderModal);
	}
}
