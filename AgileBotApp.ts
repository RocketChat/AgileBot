import { IAppAccessors, IConfigurationExtend, IHttp, ILogger, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SummarizeCommand } from './commands/Summarize';
import { ThreadInit } from './commands/Thread';
import { AgileSettings } from './commands/AgileSettings';
import { MeetingReminder } from './commands/Meeting';
import { IPersistence, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IUIKitResponse } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { ExecuteBlockActionHandler } from './handlers/ExecuteBlockActionHandler';
import { ExecuteViewSubmitHandler } from './handlers/ExecuteViewSubmitHandler';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { MeetingReminderProcessor } from './lib/processors/MeetingReminderProcessor';
import { QuickPoll } from './commands/Poll';
import { QuickPollProcessor } from './lib/processors/QuickPollProcessor';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';
import { StandupMessageProcessor } from './lib/processors/StandupMessageProcessor';
import { DailyStandupProcessor } from './lib/processors/DailyStandupProcessor';

export class AgileBotApp extends App {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public async executeBlockActionHandler(
		context: UIKitBlockInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse> {
		const handler = new ExecuteBlockActionHandler(this, read, http, modify, persistence);
		return await handler.run(context);
	}

	public async executeViewSubmitHandler(
		context: UIKitViewSubmitInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	) {
		const handler = new ExecuteViewSubmitHandler(this, read, http, modify, persistence);
		return await handler.run(context);
	}

	public async extendConfiguration(configuration: IConfigurationExtend) {
		configuration.slashCommands.provideSlashCommand(new SummarizeCommand());
		configuration.slashCommands.provideSlashCommand(new ThreadInit());
		configuration.slashCommands.provideSlashCommand(new AgileSettings(this));
		configuration.slashCommands.provideSlashCommand(new MeetingReminder(this));
		configuration.slashCommands.provideSlashCommand(new QuickPoll());

		configuration.scheduler.registerProcessors([new MeetingReminderProcessor()]);
		configuration.scheduler.registerProcessors([new QuickPollProcessor()]);
        configuration.scheduler.registerProcessors([new DailyStandupProcessor()]);

		const standupProcessor = new StandupMessageProcessor();
		configuration.scheduler.registerProcessors([
			{
				id: standupProcessor.id,
				processor: standupProcessor.processor.bind(standupProcessor),
				startupSetting: {
					type: StartupType.RECURRING,
					interval: '0 0 * * *',
				},
			},
		]);
	}
}
