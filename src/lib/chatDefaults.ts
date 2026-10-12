import { derived, writable } from 'svelte/store';

import { parseSamplingOptions, type SamplingOptions } from '$lib/chat/options';
import { settingsStore } from '$lib/localStorage';
import type { ServerConfig } from '$lib/serverConfig';
import { DEFAULT_SETTINGS, type ModelRef } from '$lib/settings';

export interface ChatDefaultsView {
	defaultModel: {
		value: ModelRef | null;
		editable: boolean;
		source: 'admin' | 'user';
		adminValue: ModelRef | null;
	};
	title: {
		generateTitlesWithAI: boolean;
		titleModel: ModelRef | null;
		/** Name the conversation again once it has grown into one. Once, not on a loop. */
		regenerateTitle: boolean;
		regenerateTitleAfter: number;
		editable: boolean;
		source: 'admin' | 'user';
		admin: {
			generateTitlesWithAI: boolean;
			titleModel: ModelRef | null;
			regenerateTitle: boolean;
			regenerateTitleAfter: number;
		};
	};
	compact: {
		compactModel: ModelRef | null;
		autoCompact: boolean;
		compactThreshold: number;
		editable: boolean;
		source: 'admin' | 'user';
		admin: {
			compactModel: ModelRef | null;
			autoCompact: boolean;
			compactThreshold: number;
		};
	};
	/** Which model draws, and which one writes the prompt for it. */
	images: {
		defaultImageModel: ModelRef | null;
		imagePromptWriter: boolean;
		imagePromptModel: ModelRef | null;
		editable: boolean;
		source: 'admin' | 'user';
		admin: {
			defaultImageModel: ModelRef | null;
			imagePromptWriter: boolean;
			imagePromptModel: ModelRef | null;
		};
	};
	/** Speaking instead of typing, and what transcribes it. */
	voice: {
		voiceInput: boolean;
		voiceModel: ModelRef | null;
		editable: boolean;
		source: 'admin' | 'user';
		admin: { voiceInput: boolean; voiceModel: ModelRef | null };
	};
	/** See `ResolvedChatDefaults['sampling']`; this is the same shape client-side. */
	sampling: {
		value: SamplingOptions;
		editable: boolean;
		source: 'admin' | 'user';
		adminValue: SamplingOptions;
	};
}

const serverConfig = writable<ChatDefaultsView | null>(null);

export function applyServerChatDefaults(config: ServerConfig | null): void {
	if (config) serverConfig.set(config.chatDefaults);
}

/** The effective, reactive chat defaults (default model + title) for the user. */
export const chatDefaultsConfig = derived(
	[settingsStore, serverConfig],
	([$s, $srv]): ChatDefaultsView => {
		const ownSampling = parseSamplingOptions($s.sampling);

		const own: ChatDefaultsView = {
			defaultModel: {
				value: $s.defaultModel,
				editable: true,
				source: 'user',
				adminValue: null
			},
			title: {
				generateTitlesWithAI: $s.generateTitlesWithAI,
				titleModel: $s.titleModel,
				regenerateTitle: $s.regenerateTitle,
				regenerateTitleAfter: $s.regenerateTitleAfter,
				editable: true,
				source: 'user',
				admin: {
					generateTitlesWithAI: false,
					titleModel: null,
					regenerateTitle: false,
					regenerateTitleAfter: 3
				}
			},
			compact: {
				compactModel: $s.compactModel,
				autoCompact: $s.autoCompact,
				compactThreshold: $s.compactThreshold,
				editable: true,
				source: 'user',
				admin: {
					compactModel: null,
					autoCompact: false,
					compactThreshold: DEFAULT_SETTINGS.compactThreshold
				}
			},
			images: {
				defaultImageModel: $s.defaultImageModel,
				imagePromptWriter: $s.imagePromptWriter,
				imagePromptModel: $s.imagePromptModel,
				editable: true,
				source: 'user',
				admin: { defaultImageModel: null, imagePromptWriter: true, imagePromptModel: null }
			},
			voice: {
				voiceInput: $s.voiceInput,
				voiceModel: $s.voiceModel,
				editable: true,
				source: 'user',
				admin: { voiceInput: false, voiceModel: null }
			},
			sampling: { value: ownSampling, editable: true, source: 'user', adminValue: {} }
		};

		if (!$srv) return own;

		// Default model: locked is the admin's; editable is the live own, falling back
		// to the admin default.
		const dm = !$srv.defaultModel.editable
			? $srv.defaultModel
			: $s.defaultModel
				? { ...$srv.defaultModel, value: $s.defaultModel, source: 'user' as const }
				: { ...$srv.defaultModel, value: $srv.defaultModel.adminValue };

		// Title: locked is the admin's; editable is the live own, once the user picked
		// a title model.
		const t = !$srv.title.editable
			? $srv.title
			: $s.titleModel
				? {
						...$srv.title,
						generateTitlesWithAI: $s.generateTitlesWithAI,
						titleModel: $s.titleModel,
						regenerateTitle: $s.regenerateTitle,
						regenerateTitleAfter: $s.regenerateTitleAfter,
						source: 'user' as const
					}
				: { ...$srv.title, ...$srv.title.admin };

		// Compaction: same three states. "Own" here means the user picked a model of
		// their own: the threshold and the auto toggle stay theirs either way once
		// sharing is overridable, since those are about their patience, not policy.
		const c = !$srv.compact.editable
			? $srv.compact
			: $s.compactModel
				? {
						...$srv.compact,
						compactModel: $s.compactModel,
						autoCompact: $s.autoCompact,
						compactThreshold: $s.compactThreshold,
						source: 'user' as const
					}
				: { ...$srv.compact, ...$srv.compact.admin };

		// Images: the same three states. "Own" means they picked a model to draw
		// with; the prompt writer follows it, because a pair of models chosen half
		// from one place and half from another is a pair nobody can reason about.
		const i = !$srv.images.editable
			? $srv.images
			: $s.defaultImageModel
				? {
						...$srv.images,
						defaultImageModel: $s.defaultImageModel,
						imagePromptWriter: $s.imagePromptWriter,
						imagePromptModel: $s.imagePromptModel,
						source: 'user' as const
					}
				: { ...$srv.images, ...$srv.images.admin };

		// Voice: the same three states, with the model as the sentinel. Somebody who
		// has chosen one has an opinion about which; somebody who has not takes the
		// instance's, including whether it is switched on at all.
		const v = !$srv.voice.editable
			? $srv.voice
			: $s.voiceModel
				? {
						...$srv.voice,
						voiceInput: $s.voiceInput,
						voiceModel: $s.voiceModel,
						source: 'user' as const
					}
				: { ...$srv.voice, ...$srv.voice.admin };

		// Sampling: the same three states again, and the same sentinel. Read live
		// from the store once this account has a set of its own, so a number typed in
		// Settings reaches an open conversation without a round trip.
		const sampling = !$srv.sampling.editable
			? $srv.sampling
			: Object.keys(ownSampling).length
				? { ...$srv.sampling, value: ownSampling, source: 'user' as const }
				: { ...$srv.sampling, value: $srv.sampling.adminValue };

		return { defaultModel: dm, title: t, compact: c, images: i, voice: v, sampling };
	}
);
