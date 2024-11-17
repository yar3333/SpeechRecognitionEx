export interface KeyCombo {
    code: string;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
}

export class KeyboardHelper {

    private static readonly WINDOWS_LABELS = {
        ctrl: 'Ctrl',
        alt: 'Alt',
        shift: 'Shift',
        meta: 'Win',
    };

    private static readonly MAC_LABELS = {
        ctrl: '⌃',
        alt: '⌥',
        shift: '⇧',
        meta: '⌘',
    };

    private static readonly LINUX_LABELS = {
        ctrl: 'Ctrl',
        alt: 'Alt',
        shift: 'Shift',
        meta: 'Meta',
    };

    static keyboardEventToKeyCombo(event: KeyboardEvent): KeyCombo {
        return {
            code: event.code,
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey,
        };
    }

    /**
     * Gets the key labels for the current user agent.
     * @returns {Record<string, string>}
     */
    private static getLabelsForUserAgent(): Record<string, string> {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Macintosh')) {
            return this.MAC_LABELS;
        } else if (userAgent.includes('Windows')) {
            return this.WINDOWS_LABELS;
        } else {
            return this.LINUX_LABELS;
        }
    }

    static formatPushToTalkKey(key: KeyCombo): string {
        const labels = this.getLabelsForUserAgent();
        const parts = [];
        if (key.ctrl) {
            parts.push(labels.ctrl);
        }
        if (key.alt) {
            parts.push(labels.alt);
        }
        if (key.shift) {
            parts.push(labels.shift);
        }
        if (key.meta) {
            parts.push(labels.meta);
        }
        parts.push(key.code);
        return parts.join(' + ');
    }


    static isKeyComboMatch(keyCombo: KeyCombo, event: KeyboardEvent): boolean {
        return keyCombo.code === event.code
            && keyCombo.ctrl === event.ctrlKey
            && keyCombo.alt === event.altKey
            && keyCombo.shift === event.shiftKey
            && keyCombo.meta === event.metaKey;
    }
}
