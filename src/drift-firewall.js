// On-demand configuration comparisons and firewall evidence. No runtime dependencies.
const DriftFirewall = (() => {
    const SCHEMA = 'proxmox-toolkit-baseline/1';
    const NETWORK_KEYS = ['iface', 'type', 'address', 'address6', 'netmask', 'netmask6', 'gateway', 'gateway6', 'cidr', 'cidr6',
        'bridge_ports', 'slaves', 'bond_slaves', 'bond_mode', 'bond_miimon', 'mtu', 'bridge_vlan_aware', 'bridge_vids', 'vlan-id', 'vlan-raw-device', 'autostart'];
    const STORAGE_KEYS = ['storage', 'type', 'content', 'nodes', 'shared', 'disable', 'path', 'server', 'export', 'pool', 'vgname', 'thinpool', 'datastore', 'namespace'];
    const GUEST_KEYS = ['name', 'hostname', 'cores', 'sockets', 'cpu', 'memory', 'balloon', 'bios', 'machine', 'ostype', 'scsihw',
        'boot', 'bootdisk', 'onboot', 'startup', 'agent', 'tags', 'protection', 'numa', 'unprivileged', 'features', 'rootfs', 'efidisk0', 'tpmstate0'];
    const guestKey = key => GUEST_KEYS.includes(key) || /^(?:scsi|sata|ide|virtio|unused|mp|net|ipconfig|hostpci|usb|serial)\d+$/.test(key);
    const record = v => !!v && typeof v === 'object' && !Array.isArray(v);
    const scalar = v => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v));
    const clean = (obj, accepts) => Object.fromEntries(Object.entries(obj || {}).filter(([key, value]) => accepts(key) && scalar(value)));
    const select = (obj, keys) => clean(obj, key => keys.includes(key));
    const array = v => Array.isArray(v) ? v : [];
    const flag = value => [1, '1', true].includes(value) ? true : [0, '0', false].includes(value) ? false : null;
    const flagText = value => value === null ? 'unspecified / unknown' : value ? 'explicitly enabled' : 'explicitly disabled';
    const failBaseline = () => { throw Error('Choose a valid Toolkit configuration baseline under 4 MiB with matching origin and scope.'); };
    function origin(value) {
        try { const u = new URL(value); if (u.protocol === 'https:' && u.origin === value && !u.username && !u.password) return u.origin; } catch { /* fixed error below */ }
        return failBaseline();
    }
    function apiPrefix(value = '/') {
        if (typeof value !== 'string' || !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value)) failBaseline();
        return value;
    }
    function requestedScope(options = {}) {
        const vmids = typeof options.vmids === 'string' ? options.vmids.split(/[;,\s]+/).filter(Boolean) : array(options.vmids).map(String);
        if (vmids.some(v => !/^\d+$/.test(v)) || vmids.length > 2000) failBaseline();
        return { node: options.node || null, vmids: [...new Set(vmids)].sort() };
    }
    function guardImport(value) {
        const stack = [[value, 0]], seen = new Set(); let entries = 0;
        while (stack.length) {
            const [item, depth] = stack.pop();
            if (++entries > 100000 || depth > 12) failBaseline();
            if (item !== null && typeof item === 'object') {
                if (seen.has(item)) failBaseline();
                seen.add(item);
                const pairs = Object.entries(item);
                if (pairs.length > 10000) failBaseline();
                for (const [key, entry] of pairs) {
                    if (['__proto__', 'constructor', 'prototype'].includes(key)) failBaseline();
                    stack.push([entry, depth + 1]);
                }
            } else if (item !== null && !scalar(item)) failBaseline();
        }
        // Measure the actual pretty-printed export's UTF-8 size, including JSON escaping.
        const text = JSON.stringify(value, null, 2); let bytes = 0;
        for (let i = 0; i < text.length; i++) {
            const cp = text.codePointAt(i);
            bytes += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
            if (cp > 0xffff) i++;
            if (bytes > 4 * 1024 * 1024) failBaseline();
        }
    }
    function validateBaseline(value, options = {}) {
        const b = record(value) && value.schema === 'proxmox-toolkit-report/1' && value.feature === 'DRIFT' ? value.baseline : value;
        guardImport(b);
        if (!record(b) || b.schema !== SCHEMA || !record(b.scope) || typeof b.collectedAt !== 'string' || !Number.isFinite(Date.parse(b.collectedAt)) ||
            !Array.isArray(b.guests) || b.guests.length > 2000 || !Array.isArray(b.nodes) || b.nodes.length > 100 ||
            !(b.storage === null || Array.isArray(b.storage) && b.storage.length <= 2000)) failBaseline();
        const source = origin(b.origin);
        const prefix = apiPrefix(b.apiPrefix);
        if (options.origin !== undefined && source !== origin(options.origin)) failBaseline();
        if (options.apiPrefix !== undefined && prefix !== apiPrefix(options.apiPrefix)) failBaseline();
        if (!(b.scope.node === null || typeof b.scope.node === 'string' && b.scope.node.length <= 255) ||
            !Array.isArray(b.scope.vmids) || b.scope.vmids.some(id => typeof id !== 'string' || !/^\d+$/.test(id))) failBaseline();
        const scope = requestedScope(b.scope);
        if (options.node !== undefined || options.vmids !== undefined) {
            if (JSON.stringify(scope) !== JSON.stringify(requestedScope(options))) failBaseline();
        }
        const unique = new Set();
        const guests = b.guests.map(g => {
            if (!record(g) || !['qemu', 'lxc'].includes(g.type) || !/^\d+$/.test(String(g.vmid)) || !Number.isSafeInteger(Number(g.vmid)) || Number(g.vmid) < 1 || typeof g.node !== 'string' ||
                !(g.configuration === null || record(g.configuration))) failBaseline();
            const key = `${g.type}/${Number(g.vmid)}`; if (unique.has(key)) failBaseline(); unique.add(key);
            if (g.configuration && Object.keys(g.configuration).length > 256) failBaseline();
            if (g.configuration && Object.entries(g.configuration).some(([key, v]) => guestKey(key) && !scalar(v))) failBaseline();
            return { type: g.type, vmid: Number(g.vmid), node: g.node, configuration: g.configuration === null ? null : clean(g.configuration, guestKey) };
        });
        const nodeNames = new Set();
        const nodes = b.nodes.map(n => {
            if (!record(n) || typeof n.node !== 'string' || nodeNames.has(n.node) || !(n.network === null || Array.isArray(n.network) && n.network.length <= 1000)) failBaseline();
            nodeNames.add(n.node);
            const network = n.network === null ? null : n.network.map(i => {
                if (!record(i) || typeof i.iface !== 'string') failBaseline();
                if (Object.entries(i).some(([key, v]) => NETWORK_KEYS.includes(key) && !scalar(v))) failBaseline();
                return select(i, NETWORK_KEYS);
            });
            if (network && new Set(network.map(i => i.iface)).size !== network.length) failBaseline();
            return { node: n.node, network };
        });
        const storage = b.storage === null ? null : b.storage.map(s => {
            if (!record(s) || typeof s.storage !== 'string') failBaseline();
            if (Object.entries(s).some(([key, v]) => STORAGE_KEYS.includes(key) && !scalar(v))) failBaseline();
            return select(s, STORAGE_KEYS);
        });
        if (storage && new Set(storage.map(s => s.storage)).size !== storage.length) failBaseline();
        return { schema: SCHEMA, origin: source, apiPrefix: prefix, collectedAt: b.collectedAt, scope, guests, nodes, storage };
    }
    function boundedList(ctx, value, limit, path) {
        if (value === null) return null;
        if (!Array.isArray(value)) { ctx.report.issues.push({ path, reason: 'Unexpected list shape' }); return null; }
        if (value.length > limit) ctx.report.issues.push({ path, reason: `${limit}-entry limit reached; evidence incomplete` });
        const selected = value.slice(0, limit);
        if (selected.some(v => !record(v))) {
            ctx.report.issues.push({ path, reason: 'Malformed list entry; evidence unavailable' }); return null;
        }
        return selected;
    }
    function keyedList(ctx, list, path, key) {
        if (list === null) return null;
        if (list.some(v => typeof v[key] !== 'string' || !v[key]) || new Set(list.map(v => v[key])).size !== list.length) {
            ctx.report.issues.push({ path, reason: `Malformed or duplicate ${key}; evidence unavailable` }); return null;
        }
        return list;
    }
    async function drift(ctx) {
        const { report, get, guests, nodes, config, each, options, part } = ctx;
        const scope = requestedScope(options);
        const source = origin(options.origin);
        const prefix = apiPrefix(options.apiPrefix);
        // Validate before collecting anything additional; imported values never supply request paths.
        const previous = options.baseline ? validateBaseline(options.baseline, { ...scope, origin: source, apiPrefix: prefix }) : null;
        const baseline = { schema: SCHEMA, origin: source, apiPrefix: prefix, collectedAt: report.collectedAt, scope, guests: [], nodes: [], storage: null };
        await each(guests, async g => {
            const c = await config(g);
            baseline.guests.push({ type: g.type, vmid: Number(g.vmid), node: g.node, configuration: c === null ? null : clean(c, guestKey) });
        });
        await each(nodes, async node => {
            const path = `/nodes/${part(node)}/network`, list = keyedList(ctx, boundedList(ctx, await get(path), 1000, path), path, 'iface');
            baseline.nodes.push({ node, network: list === null ? null : list.map(n => select(n, NETWORK_KEYS)).sort((a, b) => a.iface.localeCompare(b.iface)) });
        });
        const stores = keyedList(ctx, boundedList(ctx, await get('/storage'), 2000, '/storage'), '/storage', 'storage');
        baseline.storage = stores === null ? null : stores.filter(s => !scope.node || !s.nodes || String(s.nodes).split(/[;,\s]+/).includes(scope.node))
            .map(s => select(s, STORAGE_KEYS)).sort((a, b) => a.storage.localeCompare(b.storage));
        baseline.guests.sort((a, b) => `${a.type}/${a.vmid}`.localeCompare(`${b.type}/${b.vmid}`));
        baseline.nodes.sort((a, b) => a.node.localeCompare(b.node));
        try { report.baseline = validateBaseline(baseline); }
        catch {
            report.baseline = null;
            report.issues.push({ path: 'baseline', reason: 'Baseline exceeds supported import size/shape limits; narrow the scope before exporting a reusable baseline.' });
        }
        report.comparison = previous ? { previousCollectedAt: previous.collectedAt, currentCollectedAt: baseline.collectedAt } : null;
        const row = (resource, setting, before, after, state, extra = {}) => report.rows.push({ resource, setting, before, after, state, ...extra });
        const compare = (resource, a, b, extra = {}, isGuest = false) => {
            if (a === null || b === null) { row(resource, 'configuration', a === null ? 'unknown' : 'collected', b === null ? 'unknown' : 'collected', 'comparison unavailable', extra); return; }
            const normalize = value => {
                const c = { ...value };
                if (isGuest && options.ignoreIdentity !== false) {
                    delete c.name; delete c.hostname;
                    for (const key of Object.keys(c)) if (/^net\d+$/.test(key)) c[key] = String(c[key]).replace(/([a-z0-9_-]+=)[0-9a-f]{2}(?::[0-9a-f]{2}){5}/ig, '$1<MAC>');
                }
                return c;
            };
            const left = normalize(a), right = normalize(b);
            for (const key of [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()) {
                if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) row(resource, key, left[key] ?? null, right[key] ?? null,
                    !Object.hasOwn(left, key) ? 'setting added' : !Object.hasOwn(right, key) ? 'setting removed' : 'changed', extra);
            }
        };
        const compareList = (label, a, b, key) => {
            if (a === null || b === null) { compare(label, a === null ? null : {}, b === null ? null : {}); return; }
            const left = new Map(a.map(v => [v[key], v])), right = new Map(b.map(v => [v[key], v]));
            for (const id of [...new Set([...left.keys(), ...right.keys()])].sort()) {
                if (!left.has(id) || !right.has(id)) row(`${label}/${id}`, 'visibility', left.has(id) ? 'visible' : 'not observed', right.has(id) ? 'visible' : 'not observed', right.has(id) ? 'newly visible' : 'not currently visible; deletion not established');
                else compare(`${label}/${id}`, left.get(id), right.get(id));
            }
        };
        if (!previous) {
            for (const g of baseline.guests) row(`${g.type}/${g.vmid}`, 'baseline', null, g.configuration === null ? 'unknown' : 'collected', 'baseline captured', { node: g.node, type: g.type, vmid: g.vmid });
            for (const n of baseline.nodes) row(`node/${n.node}`, 'network baseline', null, n.network === null ? 'unknown' : `${n.network.length} interfaces`, 'baseline captured');
            row('storage', 'baseline', null, baseline.storage === null ? 'unknown' : `${baseline.storage.length} definitions`, 'baseline captured');
        } else {
            const oldGuests = new Map(previous.guests.map(g => [`${g.type}/${g.vmid}`, g])), newGuests = new Map(baseline.guests.map(g => [`${g.type}/${g.vmid}`, g]));
            for (const key of [...new Set([...oldGuests.keys(), ...newGuests.keys()])].sort()) {
                const a = oldGuests.get(key), b = newGuests.get(key), g = b || a, extra = { node: g.node, type: g.type, vmid: g.vmid };
                if (!a || !b) row(key, 'visibility', a ? 'visible' : 'not observed', b ? 'visible' : 'not observed', b ? 'newly visible' : 'not currently visible; deletion not established', extra);
                else {
                    if (a.node !== b.node) row(key, 'node', a.node, b.node, 'placement changed; identity continuity not established', extra);
                    compare(key, a.configuration, b.configuration, extra, true);
                }
            }
            const oldNodes = new Map(previous.nodes.map(n => [n.node, n])), newNodes = new Map(baseline.nodes.map(n => [n.node, n]));
            for (const node of [...new Set([...oldNodes.keys(), ...newNodes.keys()])].sort()) compareList(`node/${node}/network`, oldNodes.get(node)?.network ?? null, newNodes.get(node)?.network ?? null, 'iface');
            compareList('storage', previous.storage, baseline.storage, 'storage');
        }
        report.notes.push(previous ? 'Changes compare two explicit observations, not a continuous audit log. No actor or exact change time is established.' : report.baseline ? 'Download configuration baseline to preserve this observation, then import it on a later run with the same origin, API prefix and scope. No history is stored automatically.' : 'A reusable baseline could not be produced. Narrow the scope and run again.');
        report.notes.push('Guest identity is matched by type and VMID. Reused VMIDs, rebuilt nodes and permission changes cannot be distinguished reliably; absence never proves deletion. Configuration and network secrets/free-form comments are omitted.');
        report.notes.push('Storage definitions are cluster-wide within the selected node restriction; guest filters apply only to guest configuration. Missing, capped and inaccessible data remain incomplete evidence.');
    }
    async function firewall(ctx) {
        const { report, get, guests, nodes, config, each, part, guestPath } = ctx;
        const optionKeys = ['enable', 'nftables', 'policy_in', 'policy_out', 'policy_forward', 'ipfilter', 'macfilter', 'dhcp', 'ndp', 'radv', 'log_level_in', 'log_level_out'];
        const ruleKeys = ['pos', 'type', 'action', 'enable', 'source', 'dest', 'proto', 'sport', 'dport', 'iface', 'macro', 'ipversion', 'icmp-type', 'log'];
        const evidence = { cluster: null, nodes: [], guests: [], groups: [], groupListAvailable: false };
        report.firewall = evidence;
        const references = new Map();
        const addReference = (group, scope) => {
            if (typeof group !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(group)) {
                report.issues.push({ path: scope, reason: 'Invalid security-group reference; not followed' }); return;
            }
            if (!references.has(group)) references.set(group, new Set());
            references.get(group).add(scope);
        };
        const row = (scope, kind, item, value, details = null, extra = {}) => report.rows.push({ scope, kind, item, value, details, ...extra });
        async function rulesAt(path) {
            const list = boundedList(ctx, await get(path), 1000, path);
            if (list === null) return null;
            if (list.some(r => typeof r.type !== 'string' || typeof r.action !== 'string' || (r.pos !== undefined && (!Number.isInteger(r.pos) || r.pos < 0)))) {
                report.issues.push({ path, reason: 'Malformed firewall rule; evidence unavailable' }); return null;
            }
            return list.map(r => select(r, ruleKeys)).sort((a, b) => (a.pos ?? Infinity) - (b.pos ?? Infinity));
        }
        async function collect(scope, path, withSets, extra = {}) {
            const rawOptions = await get(`${path}/options`, {}, 'object');
            const options = record(rawOptions) ? select(rawOptions, optionKeys) : null;
            const rules = await rulesAt(`${path}/rules`);
            const entry = { scope, options, rules, aliases: null, ipsets: null, ...extra };
            row(scope, 'enablement', 'Firewall flag', options === null ? 'unavailable' : flagText(flag(options.enable)), null, extra);
            for (const key of ['policy_in', 'policy_out', 'policy_forward']) if (options && Object.hasOwn(options, key)) row(scope, 'policy', key, options[key], null, extra);
            if (rules === null) row(scope, 'rules', 'Rule list', 'unavailable', null, extra);
            else for (const r of rules) {
                row(scope, r.type === 'group' ? 'group reference' : 'rule', `Rule ${r.pos ?? '?'}`, `${r.type ?? 'unknown'} ${r.action ?? 'unknown'}`,
                    { ...r, enabled: flag(r.enable) }, extra);
                if (r.type === 'group') addReference(r.action, scope);
            }
            if (withSets) {
                const aliases = keyedList(ctx, boundedList(ctx, await get(`${path}/aliases`), 1000, `${path}/aliases`), `${path}/aliases`, 'name');
                entry.aliases = aliases === null ? null : aliases.map(a => select(a, ['name', 'cidr']));
                let sets = keyedList(ctx, boundedList(ctx, await get(`${path}/ipset`), 50, `${path}/ipset`), `${path}/ipset`, 'name');
                if (sets?.some(s => !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(s.name))) {
                    report.issues.push({ path: `${path}/ipset`, reason: 'Invalid IP-set name; evidence unavailable' }); sets = null;
                }
                entry.ipsets = sets === null ? null : [];
                await each(array(sets), async s => {
                    const p = `${path}/ipset/${part(s.name)}`, members = keyedList(ctx, boundedList(ctx, await get(p), 1000, p), p, 'cidr');
                    entry.ipsets.push({ name: s.name, members: members === null ? null : members.map(m => select(m, ['cidr', 'nomatch'])) });
                });
                entry.ipsets?.sort((a, b) => a.name.localeCompare(b.name));
            }
            return entry;
        }
        evidence.cluster = await collect('cluster', '/cluster/firewall', true);
        const listed = keyedList(ctx, boundedList(ctx, await get('/cluster/firewall/groups'), 100, '/cluster/firewall/groups'), '/cluster/firewall/groups', 'group');
        evidence.groupListAvailable = listed !== null;
        const listedGroups = new Set(array(listed).map(g => g.group).filter(g => typeof g === 'string'));
        await each(nodes, async node => {
            const entry = await collect(`node/${node}`, `/nodes/${part(node)}/firewall`, false, { node });
            const backend = flag(entry.options?.nftables);
            entry.backend = backend === null ? 'unspecified / unknown' : backend ? 'nftables requested' : 'legacy requested';
            row(entry.scope, 'backend', 'Configured backend', entry.backend, 'Runtime service state is not established.', { node });
            evidence.nodes.push(entry);
        });
        await each(guests, async g => {
            const extra = { node: g.node, vmid: g.vmid, type: g.type }, scope = `${g.type}/${g.vmid}`;
            const entry = await collect(scope, `${guestPath(g)}/firewall`, true, extra), c = await config(g);
            entry.nics = c === null ? null : Object.entries(c).filter(([key]) => /^net\d+$/.test(key)).map(([nic, value]) => {
                const fields = ctx.fields(value); return { nic, firewall: flag(fields.firewall), bridge: fields.bridge ?? null };
            });
            if (entry.nics === null) row(scope, 'NIC flags', 'NIC configuration', 'unavailable', null, extra);
            for (const nic of array(entry.nics)) row(scope, 'NIC flag', nic.nic, flagText(nic.firewall), { bridge: nic.bridge }, extra);
            evidence.guests.push(entry);
        });
        // Iterative graph collection prevents recursive cycles and fetches shared groups once.
        const fetched = new Set();
        while (true) {
            if (ctx.options.signal?.aborted) break;
            const pending = [...references.keys()].filter(g => !fetched.has(g)).sort().slice(0, Math.max(0, 100 - fetched.size));
            if (!pending.length) break;
            await each(pending, async group => {
                fetched.add(group);
                const path = `/cluster/firewall/groups/${part(group)}`, rules = await rulesAt(path);
                const item = { group, listed: listed === null ? null : listedGroups.has(group), rules, usedBy: [] };
                evidence.groups.push(item);
                for (const r of array(rules)) if (r.type === 'group') addReference(r.action, `group/${group}`);
            });
        }
        if ([...references.keys()].some(g => !fetched.has(g))) report.issues.push({ path: '/cluster/firewall/groups', reason: '100 referenced-group limit reached; evidence incomplete' });
        const groupMap = new Map(evidence.groups.map(g => [g.group, g]));
        for (const group of evidence.groups) {
            group.usedBy = [...(references.get(group.group) || [])].sort();
            const visited = new Set(), stack = [group.group]; let cycle = false;
            while (stack.length) {
                const current = stack.pop(); if (visited.has(current)) continue; visited.add(current);
                for (const r of array(groupMap.get(current)?.rules)) if (r.type === 'group' && typeof r.action === 'string') {
                    if (r.action === group.group) cycle = true;
                    else if (!visited.has(r.action)) stack.push(r.action);
                }
            }
            group.cycle = cycle;
            row('cluster', 'security group', group.group, group.rules === null ? 'unavailable' : cycle ? 'reference cycle; inspect configuration' : `${group.rules.length} configured rules`, { usedBy: group.usedBy, listed: group.listed, rules: group.rules });
        }
        evidence.nodes.sort((a, b) => a.scope.localeCompare(b.scope));
        evidence.guests.sort((a, b) => a.scope.localeCompare(b.scope));
        evidence.groups.sort((a, b) => a.group.localeCompare(b.group));
        report.rows.sort((a, b) => a.scope.localeCompare(b.scope));
        report.notes.push('Configured firewall evidence only. Explicit flags, backend requests and rule references do not establish loaded rules or actual packet outcomes. Omitted options retain unspecified/unknown status rather than assuming version-specific defaults.');
        report.notes.push('Cluster, node, guest and NIC settings have different scopes. Node host rules are not treated as an inherited guest ruleset. Connection state, guest firewalls, switches, SDN and runtime backend behavior require separate checks.');
        report.notes.push('Security-group usage covers collected scopes only, including disabled references. Aliases and IP sets are in Additional evidence/JSON. Free-form comments are omitted; addresses and rules may still be sensitive.');
    }
    return { drift, firewall, validateBaseline };
})();
if (typeof module !== 'undefined') module.exports = DriftFirewall;
