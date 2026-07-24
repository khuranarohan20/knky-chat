// Ported verbatim from the agency link-highlighter: normalise bare knky.co
// links in composed text to absolute https URLs before sending.
export const KNKY_LINK_RE =
  /(^|[\s(>"'”’])((?:https?:\/\/)?(?:www\.)?knky\.co(?!\.[A-Za-z0-9-])(?:[\/?#]\S*)?)/gi;

export function normalizeKnkyLinks(text: string): string {
  return text.replace(KNKY_LINK_RE, (_, prefix: string, url: string) => {
    const afterDomain = url.replace(/^((?:https?:\/\/)?(?:www\.)?knky\.co)/i, '');
    if (!/^(?:[\/?#]|$)/.test(afterDomain)) {
      return prefix + url;
    }
    let core = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    core = core.replace(/^knky\.co/i, 'https://knky.co');
    return prefix + core;
  });
}
