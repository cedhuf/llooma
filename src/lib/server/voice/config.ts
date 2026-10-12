import { resolveChatDefaults } from '$lib/server/chatDefaultsResolver';
import { getItem, getSettings } from '$lib/server/db/collections';
import type { Session } from '$lib/sessions';
import { findModel, type ModelRef, type Settings } from '$lib/settings';

/**
 * What a spoken conversation needs before anybody opens their mouth.
 *
 * Three models, and the app has to know it has all three before it offers to
 * listen: finding out by trying is how somebody speaks a whole sentence to a
 * microphone that was never going to be heard.
 *
 * Resolved here rather than in the browser: a socket is opened once and trusted
 * for a whole conversation, so what it may do is settled before it exists. A
 * snapshot, so a voice changed halfway through finishes as it started.
 */

export interface VoiceConfig {
	/** Turning what was said into words. */
	listen: ModelRef & {
		/** ISO 639-1, or empty to leave the model to work it out. */
		language: string;
	};
	/** Reading the answer back. */
	speak: ModelRef & { voice: string };
	/** Answering. The conversation's own model, or the account's default. */
	think: ModelRef;
}

/** Which half is not configured, in the terms the settings use, so a screen can name the tab somebody has to open. */
export type VoiceMissing = 'listen' | 'speak' | 'think';

export type VoiceResolution =
	{ ok: true; config: VoiceConfig } | { ok: false; missing: VoiceMissing[] };

/** A model this account can still reach, as a target. One its connection no longer offers answers nothing. */
function targetFor(settings: Settings | null, model: ModelRef | null | undefined): ModelRef | null {
	const known = findModel(settings?.models, model);
	return known ? { serverId: known.serverId, name: known.name } : null;
}

/** `sessionId` names the conversation being held: its model answers rather than the account's default, since a conversation started with one model and continued in another is two conversations wearing one title. */
export function resolveVoiceConfig(
	user: { id: string; role: string },
	sessionId: string | null
): VoiceResolution {
	const settings = getSettings(user.id);
	const defaults = resolveChatDefaults(settings, user.role === 'admin');
	const missing: VoiceMissing[] = [];

	// Transcription, which the administrator may have set up and shared: on most
	// instances they are the only person who could have.
	const listen = defaults.voice.voiceInput ? targetFor(settings, defaults.voice.voiceModel) : null;
	if (!listen) missing.push('listen');

	// Reading aloud is the account's own, and needs a voice by name as well as a
	// model: every one of these endpoints refuses without one.
	const speakVoice = settings?.speechVoice?.trim() ?? '';
	const speak =
		settings?.speechOutput && speakVoice ? targetFor(settings, settings.speechModel) : null;
	if (!speak) missing.push('speak');

	const think = thinkTarget(user.id, settings, defaults.defaultModel.value, sessionId);
	if (!think) missing.push('think');

	if (!listen || !speak || !think) return { ok: false, missing };

	return {
		ok: true,
		config: {
			listen: { ...listen, language: settings?.voiceLanguage?.trim() ?? '' },
			speak: { ...speak, voice: speakVoice },
			think
		}
	};
}

/** The model that answers: the conversation's own, or failing that the default. */
function thinkTarget(
	userId: string,
	settings: Settings | null,
	defaultModel: ModelRef | null,
	sessionId: string | null
): ModelRef | null {
	const stored = sessionId ? getItem<Session>('sessions', userId, sessionId) : null;
	// A stored conversation carries its connection with it, so it is taken whole:
	// the model may have left the catalogue, and the conversation is still held on it.
	if (stored?.model?.serverId && stored.model.name) {
		return { serverId: stored.model.serverId, name: stored.model.name };
	}

	return targetFor(settings, defaultModel);
}
