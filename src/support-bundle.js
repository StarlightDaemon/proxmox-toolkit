// Local, explicitly collected evidence. No upload or persistent report history.
const SupportBundle = (() => {
    const sections = ['versions', 'configurations', 'network', 'storage', 'diagnostics', 'task'];
    const scalar = v => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) ? v : null;
    const pick = (v, keys) => Object.fromEntries(keys.map(k => [k, scalar(v?.[k])]));
    async function collect(ctx) {
        const { report, get, guests, nodes, config, each, identity, options, safeConfig, part } = ctx;
        const selected = new Set((options.supportSections || ['versions', 'configurations', 'diagnostics']).filter(s => sections.includes(s)));
        report.bundle = { sections: [...selected], subjects: guests.map(identity), nodes: [...nodes] };
        const evidence = report.bundle.evidence = {};
        const add = (section, subject, data, state = data === null ? 'unavailable' : 'collected') => {
            (evidence[section] ||= []).push({ subject, state, data });
            report.rows.push({ section, subject, state });
        };
        if (selected.has('versions')) await each(nodes, async node => {
            const data = await get(`/nodes/${part(node)}/apt/versions`);
            add('versions', node, data === null ? null : data.map(p => pick(p, ['Package', 'OldVersion', 'Version', 'CurrentState', 'RunningKernel', 'ManagerVersion'])));
        });
        if (selected.has('configurations')) await each(guests, async g => {
            const data = await config(g);
            add('configurations', `${g.type}/${g.vmid}`, data === null ? null : safeConfig(data));
        });
        if (selected.has('network')) await each(nodes, async node => {
            const data = await get(`/nodes/${part(node)}/network`);
            add('network', node, data === null ? null : data.map(n => pick(n, ['iface', 'type', 'address', 'netmask', 'gateway', 'cidr', 'mtu', 'bridge_ports', 'slaves', 'bond_slaves', 'bridge_vlan_aware', 'vlan-id'])));
        });
        if (selected.has('storage')) {
            const data = await get('/storage');
            add('storage', 'cluster', data === null ? null : data.map(s => pick(s, ['storage', 'type', 'content', 'nodes', 'shared', 'path', 'server', 'export', 'pool', 'vgname', 'thinpool'])));
        }
        if (selected.has('diagnostics')) add('diagnostics', 'Toolkit', pick(options.toolkit, ['version', 'edition', 'manager', 'clipboardRead', 'clipboardWrite', 'secureContext']));
        if (selected.has('task')) {
            const upid = String(options.upid || '').trim(), node = upid.match(/^UPID:([^:]+):.+/)?.[1];
            if (!node || !nodes.includes(node)) {
                report.issues.push({ path: 'task', reason: 'Task owner is not visible in the selected scope; no task collected' });
            } else {
                const base = `/nodes/${part(node)}/tasks/${part(upid)}`;
                const status = await get(`${base}/status`, {}, 'object');
                const log = await get(`${base}/log`, { start: 0, limit: 5000 });
                add('task', upid, { status: status === null ? null : pick(status, ['status', 'exitstatus', 'type', 'starttime', 'endtime']),
                    log: log === null ? null : log.slice(0, 5000).map(l => pick(l, ['n', 't'])) },
                    status === null && log === null ? 'unavailable' : status === null || log === null ? 'partial' : 'collected');
                if (log?.length >= 5000) report.issues.push({ path: 'task', reason: '5,000-line limit reached; log may be incomplete' });
            }
        }
        report.notes.push('Review the prepared preview before sharing. Assisted redaction cannot identify every secret in task logs or free text.');
        report.notes.push('Selected structured evidence only; not a complete pvereport, host backup or automatic support submission. No console text or clipboard content is collected.');
    }
    function prepare(report, options = {}) {
        const symptoms = String(options.symptoms || ''), steps = String(options.steps || '');
        const custom = String(options.replacements || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        if (symptoms.length + steps.length > 65536 || custom.length > 100 || custom.some(s => s.length > 256))
            throw Error('Keep the narrative under 65,536 characters and replacements to 100 lines of at most 256 characters.');
        const source = { schema: 'proxmox-toolkit-support/1', collectedAt: report.collectedAt,
            scope: report.scope, selection: report.selection, symptoms, reproductionSteps: steps,
            bundle: report.bundle, issues: report.issues, notes: report.notes };
        const known = new Set(custom);
        if (options.redact !== false) {
            for (const n of report.bundle?.nodes || []) if (typeof n === 'string') known.add(n);
            for (const g of report.bundle?.subjects || []) for (const k of ['node', 'name']) if (typeof g[k] === 'string' && g[k]) known.add(g[k]);
            for (const entry of report.bundle?.evidence?.configurations || []) for (const k of ['name', 'hostname'])
                if (typeof entry.data?.[k] === 'string' && entry.data[k]) known.add(entry.data[k]);
            for (const entry of report.bundle?.evidence?.storage || []) for (const s of entry.data || [])
                if (typeof s.server === 'string' && s.server) known.add(s.server);
        }
        const labels = new Map();
        const label = value => {
            if (!labels.has(value)) { if (labels.size >= 10000) return '[REDACTED]'; labels.set(value, `[REDACTED-${labels.size + 1}]`); }
            return labels.get(value);
        };
        // Secrets are replaced first with a private-use sentinel so that identifier
        // matching cannot consume a key prefix (for example host.password=...) and
        // generated placeholders are never reprocessed by later patterns.
        const SENTINEL = '\uE000';
        let secrets = 0;
        const secret = (prefix = '', quote = '') => { secrets++; return `${prefix}${quote}${SENTINEL}${quote}`; };
        const secretPattern = options.redact === false ? null : new RegExp([
            // Whole header values, including multi-pair Cookie headers and Bearer/Basic schemes.
            String.raw`(?<header>(?:\b(?:proxy-)?authorization|\bset-cookie|\bcookie)\s*:\s*)[^\r\n]+`,
            // Keyed values. No leading word boundary: PVE names embed the keyword
            // (CSRFPreventionToken, PVEAuthCookie, PVEAPIToken, client_secret).
            String.raw`(?<key>(?:password|passwd|passphrase|token|secret|cookie|ticket|authorization|api[_-]?key|private[_-]?key)["']?\s*[:=]\s*)(?:"(?<dq>[^"\r\n]*)"|'(?<sq>[^'\r\n]*)'|[^\s,;"'&]+)`,
            // Bare PVE API token secret after user@realm!tokenid=; the identity is labelled later.
            String.raw`(?<=@[\w.-]+![\w.-]+=)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b`,
            // Bare PVE authentication or VNC ticket.
            String.raw`\bPVE(?:VNC)?:[^\s:]*:[0-9a-f]{8}::[a-z0-9+/=]+`,
        ].join('|'), 'gi');
        // Match original text once: generated placeholders must never be reprocessed.
        // Email and host matches anchor on a lookbehind rather than a word boundary so a long
        // hyphen/dot run offers one start position instead of one per word.
        const literals = [...known].filter(Boolean).sort((a, b) => b.length - a.length);
        const patterns = options.redact === false ? [] : [
            String.raw`(?<email>(?<![A-Z0-9._%+-])[A-Z0-9._%+-]+@[A-Z0-9.-]+(?:\.[A-Z]{2,}|![A-Z0-9._-]+)?\b)`,
            String.raw`(?<mac>\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b)`,
            String.raw`(?<ipv4>\b(?:\d{1,3}\.){3}\d{1,3}\b)`,
            String.raw`(?<ipv6>(?<![\w])(?:[0-9a-f]{0,4}:){2,}[0-9a-f:.]*(?![\w]))`,
            String.raw`(?<host>(?<![a-z0-9-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*\b)`,
        ];
        if (literals.length) patterns.push(`(?<literal>(?<![\\w.-])(?:${literals.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w.-]))`);
        const pattern = patterns.length ? new RegExp(patterns.join('|'), 'gi') : null;
        // Clock times such as 01:02:03 share IPv6 characters but are not addresses:
        // require a compressed form, eight groups, or six groups plus embedded IPv4.
        const ipv6 = value => {
            const colons = value.split(':').length - 1;
            return value.includes('::') || colons >= 7 || (colons >= 6 && /\d+\.\d+\.\d+\.\d+$/.test(value));
        };
        const scrub = value => {
            let text = value;
            if (secretPattern) text = text.replace(secretPattern, (...args) => {
                const groups = args.at(-1);
                if (groups.header !== undefined) return secret(groups.header);
                if (groups.key !== undefined) return secret(groups.key, groups.dq !== undefined ? '"' : groups.sq !== undefined ? "'" : '');
                return secret();
            });
            if (pattern) text = text.replace(pattern, (match, ...args) => args.at(-1).ipv6 !== undefined && !ipv6(match) ? match : label(match));
            return secretPattern ? text.replaceAll(SENTINEL, '[REDACTED-SECRET]') : text;
        };
        const visit = v => typeof v === 'string' ? scrub(v) : Array.isArray(v) ? v.map(visit) : v && typeof v === 'object' ?
            Object.fromEntries(Object.entries(v).map(([k, item]) => [k, visit(item)])) : v;
        const preview = visit(source);
        preview.schema = source.schema; preview.collectedAt = source.collectedAt;
        preview.redaction = { enabled: options.redact !== false, replacements: labels.size, secretValues: secrets,
            limitation: 'Assisted redaction; inspect and edit this preview. No guarantee that all sensitive data was detected.' };
        const json = JSON.stringify(preview, null, 2);
        let fenceLength = 3;
        for (const match of json.matchAll(/`+/g)) fenceLength = Math.max(fenceLength, match[0].length + 1);
        const fence = '`'.repeat(fenceLength);
        return { json, markdown: `# Proxmox troubleshooting bundle\n\nReview before sharing. Collected ${report.collectedAt}.\n\n${fence}json\n${json}\n${fence}\n`, replacements: labels.size + secrets };
    }
    return { collect, prepare, sections };
})();
if (typeof module !== 'undefined') module.exports = SupportBundle;
