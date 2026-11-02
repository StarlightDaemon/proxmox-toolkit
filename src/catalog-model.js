// Pure report logic. Included at build time; no runtime module loader.
const CatalogModel = (() => {
    const array = value => Array.isArray(value) ? value : [];
    const scalar = value => ['string', 'number', 'boolean'].includes(typeof value) ? value : null;
    const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, scalar(value?.[key])]));
    const part = value => encodeURIComponent(String(value));
    const guestPath = g => `/nodes/${part(g.node)}/${g.type}/${part(g.vmid)}`;
    const split = value => typeof value === 'string' ? value.split(/[;,\s]+/).filter(Boolean) : [];
    function scopeError(id, options = {}) {
        const ids = [...new Set(split(options.vmids))];
        if (id === 'COMPARE' && ids.length !== (options.baseline ? 1 : 2))
            return 'Select two visible guest IDs, or one guest and an exported configuration baseline.';
        if (id === 'TASK_REPORT') {
            const node = String(options.node || '').trim();
            const taskNode = String(options.upid || '').trim().match(/^UPID:([^:]+):.+/)?.[1];
            if (!taskNode) return 'Enter a complete UPID; its owning node is detected automatically.';
            if (node && node !== taskNode) return 'The UPID must belong to the selected owning node.';
        }
        return null;
    }
    const fields = value => Object.fromEntries(String(value ?? '').split(',').map((entry, i) => {
        const at = entry.indexOf('=');
        return at < 0 ? [i === 0 ? 'volume' : entry, i === 0 ? entry : true] : [entry.slice(0, at), entry.slice(at + 1)];
    }));
    const diskKey = key => /^(?:scsi|sata|ide|virtio|unused|mp)\d+$/.test(key) || ['rootfs', 'efidisk0', 'tpmstate0'].includes(key);
    const configKey = key => diskKey(key) || /^(?:net|ipconfig|hostpci|usb|serial)\d+$/.test(key) ||
        ['name', 'hostname', 'cores', 'sockets', 'cpu', 'memory', 'balloon', 'bios', 'machine', 'ostype', 'scsihw',
            'boot', 'bootdisk', 'onboot', 'startup', 'agent', 'tags', 'protection', 'numa', 'unprivileged', 'features'].includes(key);
    function safeConfig(config) {
        return Object.fromEntries(Object.entries(config || {}).filter(([k, v]) => configKey(k) && scalar(v) !== null));
    }
    function configDiff(left, right, ignoreIdentity = true) {
        const clean = value => {
            const out = { ...value };
            for (const key of ['digest', 'description', 'cipassword', 'sshkeys', 'args', 'hookscript', 'cicustom']) delete out[key];
            if (ignoreIdentity) {
                for (const key of ['name', 'hostname', 'vmgenid', 'smbios1']) delete out[key];
                for (const key of Object.keys(out)) if (/^net\d+$/.test(key))
                    out[key] = String(out[key]).replace(/([a-z0-9_-]+=)[0-9a-f]{2}(?::[0-9a-f]{2}){5}/ig, '$1<MAC>');
            }
            return out;
        };
        const a = clean(left), b = clean(right);
        return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
            .filter(key => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
            .map(key => ({ setting: key, left: a[key] ?? null, right: b[key] ?? null }));
    }
    function mounts(config, type) {
        return Object.entries(config || {}).filter(([k]) => diskKey(k)).map(([key, raw]) => {
            const f = fields(raw), volume = String(f.volume ?? f.file ?? '');
            const unused = key.startsWith('unused');
            const external = type === 'lxc' && volume.startsWith('/');
            const excluded = unused || f.media === 'cdrom' || (type === 'lxc' && key !== 'rootfs' ? external || f.backup !== '1' : f.backup === '0');
            return { key, volume, unused, excluded, reason: unused ? 'Unused attachment' :
                f.media === 'cdrom' ? 'Installation media' : external ? 'External bind/device mount' : excluded ? 'Backup disabled' : 'Included by configuration' };
        });
    }
    function coverage(guest, jobs) {
        if (!Array.isArray(jobs)) return 'unknown';
        let unknown = false;
        for (const j of jobs) {
            if (j.enabled === 0 || j.enabled === false || j.enabled === '0') continue;
            if (j.node && j.node !== guest.node) continue;
            if (split(j.exclude).includes(String(guest.vmid))) continue;
            if (j['exclude-tags'] || j['include-tags'] || j['tag-filter']) { unknown = true; continue; }
            if (j.pool) {
                if (guest.pool == null) unknown = true;
                else if (guest.pool === j.pool) return 'scheduled';
                continue;
            }
            if (j.all === 1 || j.all === true || j.all === '1' || split(j.vmid).includes(String(guest.vmid))) return 'scheduled';
        }
        return unknown ? 'unknown selection' : 'no matching visible job';
    }
    function csv(rows, columns) {
        const cell = v => {
            let s = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
            if (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = `'${s}`;
            return `"${s.replace(/"/g, '""')}"`;
        };
        return [columns.map(cell).join(','), ...rows.map(r => columns.map(k => cell(r[k])).join(','))].join('\r\n');
    }
    function networkPaths(guest, config, networks) {
        const byName = new Map(array(networks).map(n => [n.iface, n]));
        const walk = (name, seen = new Set()) => {
            if (seen.has(name)) return [{ interface: name, state: 'cycle' }];
            const n = byName.get(name);
            if (!n) return [{ interface: name, state: 'not visible / external' }];
            const next = new Set(seen).add(name);
            const ports = split(n.bridge_ports || n.slaves || n.bond_slaves || n['vlan-raw-device']);
            return [{ ...pick(n, ['iface', 'type', 'mtu', 'active', 'bridge_vlan_aware', 'vlan-id']),
                upstream: ports.map(p => walk(p, next)) }];
        };
        return Object.entries(config || {}).filter(([k]) => /^net\d+$/.test(k)).map(([nic, raw]) => {
            const f = fields(raw);
            return { vmid: guest.vmid, node: guest.node, nic, bridge: f.bridge ?? null, vlan: f.tag ?? null,
                trunks: f.trunks ?? null, mtu: f.mtu ?? null, configuredPath: f.bridge ? walk(f.bridge) : [],
                connectivity: 'Not tested; physical switches and guest routing are outside this report' };
        });
    }
    async function run(id, read, options = {}) {
        options = { ...options, node: String(options.node || '').trim(), upid: String(options.upid || '').trim() };
        const invalidScope = scopeError(id, options);
        if (invalidScope) throw Error(invalidScope);
        if (id === 'TASK_REPORT' && !options.node) options.node = options.upid.split(':')[1];
        const report = { schema: 'proxmox-toolkit-report/1', feature: id, collectedAt: new Date().toISOString(),
            scope: 'Visible resources in this PVE origin; permission filtering can hide resources without an error',
            rows: [], issues: [], notes: [] };
        const cache = new Map();
        async function get(path, query = {}) {
            const key = path + JSON.stringify(query);
            if (!cache.has(key)) cache.set(key, (async () => {
                const r = await read(path, query);
                if (r.error) report.issues.push({ path, reason: r.error });
                if (r.error) return null;
                const objectExpected = /\/config$|\/agent\/network-get-interfaces$|\/tasks\/[^/]+\/status$/.test(path);
                if (!r.data || (objectExpected ? typeof r.data !== 'object' || Array.isArray(r.data) : !Array.isArray(r.data))) {
                    report.issues.push({ path, reason: 'Unexpected or missing API data shape' }); return null;
                }
                return r.data;
            })());
            return cache.get(key);
        }
        const resources = await get('/cluster/resources');
        const visibleGuests = array(resources).filter(r => ['qemu', 'lxc'].includes(r.type) && /^\d+$/.test(String(r.vmid)) && typeof r.node === 'string');
        const allGuests = visibleGuests.slice(0, 2000);
        if (visibleGuests.length > 2000) report.issues.push({ path: '/cluster/resources', reason: '2,000-guest limit reached; inventory is incomplete' });
        const visibleNodes = [...new Set([...array(resources).filter(r => r.type === 'node').map(r => r.node || r.id?.replace(/^node\//, '')), ...allGuests.map(g => g.node)].filter(Boolean))];
        const nodes = visibleNodes.slice(0, 100);
        if (visibleNodes.length > 100) report.issues.push({ path: '/cluster/resources', reason: '100-node limit reached; report is incomplete' });
        if (options.node && resources !== null && !visibleNodes.includes(options.node))
            throw Error(id === 'TASK_REPORT' ? 'The task’s owning node is not visible to this account. Choose a task on a visible node.' :
                'The selected node is not visible to this account. Clear Node to use all visible nodes, or enter a visible node name.');
        const wantedNodes = options.node ? visibleNodes.filter(n => n === options.node) : nodes;
        const selected = [...new Set(split(options.vmids))];
        const guests = allGuests.filter(g => (!options.node || g.node === options.node) && (!selected.length || selected.includes(String(g.vmid))));
        report.selection = { node: options.node || null, nodes: wantedNodes, vmids: selected, visibleGuests: visibleGuests.length, selectedGuests: guests.length };
        report.scope = id === 'TASK_REPORT' ? `One task on node ${options.node}; log collection limits and permissions apply.` :
            `${options.node ? `Node ${options.node}` : 'All visible nodes'}; ${selected.length ? `guest IDs ${selected.join(', ')}` : 'all visible guests'}. Permission filtering and collection limits can leave gaps.`;
        if (resources === null) { report.notes.push('Resource discovery failed; the requested scope could not be resolved.'); return report; }
        if (!wantedNodes.length) report.notes.push('No nodes are visible to this account; no node checks could be collected.');
        for (const vmid of selected) if (!guests.some(g => String(g.vmid) === vmid))
            report.issues.push({ path: '/cluster/resources', reason: `Guest ${vmid} is not visible in the selected scope or falls outside the collection limit` });
        const configs = new Map();
        async function config(g) {
            const key = `${g.node}/${g.type}/${g.vmid}`;
            if (!configs.has(key)) configs.set(key, get(`${guestPath(g)}/config`, { current: 1 }));
            return configs.get(key);
        }
        // Work is scheduled in small waves as well as limited by the transport.
        async function each(items, action) {
            for (let offset = 0; offset < items.length; offset += 3) await Promise.all(items.slice(offset, offset + 3).map(action));
        }
        const identity = g => pick(g, ['vmid', 'name', 'node', 'type', 'status', 'tags', 'pool']);
        async function visibleBackups() {
            const backups = [];
            await each(nodes, async node => {
                const stores = await get(`/nodes/${part(node)}/storage`, { content: 'backup', enabled: 1 });
                if (stores !== null && !Array.isArray(stores)) report.issues.push({ path: node, reason: 'Unexpected storage-list shape' });
                await each(array(stores), async s => {
                    if (!s.active) { report.issues.push({ path: `${node}/${s.storage}`, reason: 'Backup storage inactive' }); return; }
                    const content = await get(`/nodes/${part(node)}/storage/${part(s.storage)}/content`, { content: 'backup' });
                    for (const b of array(content)) if (b.content === 'backup') backups.push({ ...b, storage: s.storage, storageNode: node });
                });
            });
            return backups;
        }
        function newestBackup(backups, g) {
            return backups.filter(b => String(b.vmid) === String(g.vmid)).sort((a, b) => b.ctime - a.ctime)[0];
        }
        if (id === 'INVENTORY') {
            await each(guests, async g => {
                const c = await config(g);
                report.rows.push({ ...identity(g), configuredMemoryMiB: c?.memory ?? null, configuredCores: c?.cores ?? null,
                    configuredSockets: c?.sockets ?? null, observedMemoryBytes: g.mem ?? null, observedCPUFraction: g.cpu ?? null,
                    disks: c ? mounts(c, g.type) : null,
                    networks: c ? Object.fromEntries(Object.entries(c).filter(([k]) => /^net\d+$/.test(k))) : null,
                    configurationAvailable: !!c });
            });
        } else if (id === 'COMPARE') {
            const pair = selected.map(v => guests.find(g => String(g.vmid) === v)).filter(Boolean);
            if (options.baseline ? pair.length !== 1 : pair.length !== 2) throw Error('Select two visible guest IDs, or one guest and an exported configuration baseline.');
            const a = await config(pair[0]), b = options.baseline || await config(pair[1]);
            if (!a || !b) throw Error('Both configurations must be readable.');
            report.rows = configDiff(a, b, options.ignoreIdentity !== false);
            report.baselines = pair.map(identity);
            report.currentConfiguration = safeConfig(a);
            report.pending = [];
            await each(pair, async g => {
                const pending = await get(`${guestPath(g)}/pending`);
                report.pending.push({ ...identity(g), changes: array(pending).filter(p => configKey(p.key) && (p.pending !== undefined || p.delete)).map(p => pick(p, ['key', 'value', 'pending', 'delete'])) });
            });
            report.notes.push('Current configurations compared. Pending changes are listed separately. Credentials and free-form descriptions are omitted.');
        } else if (id === 'SNAPSHOTS') {
            await each(guests, async g => {
                const snaps = await get(`${guestPath(g)}/snapshot`);
                if (snaps === null) report.rows.push({ ...identity(g), snapshot: null, state: 'unknown' });
                for (const s of array(snaps).filter(s => s.name !== 'current')) {
                    const ageDays = Number.isFinite(s.snaptime) ? Math.floor((Date.now() / 1000 - s.snaptime) / 86400) : null;
                    report.rows.push({ ...identity(g), snapshot: s.name, description: scalar(s.description), parent: scalar(s.parent),
                        created: s.snaptime ?? null, ageDays, review: ageDays === null ? 'unknown' : ageDays >= (options.ageDays || 30) });
                }
            });
            report.notes.push('Age is a review prompt, not a deletion recommendation. Reclaimable space is not estimated.');
        } else if (['TASKS', 'TASK_REPORT'].includes(id)) {
            if (id === 'TASK_REPORT') {
                if (!options.upid || !options.node || !wantedNodes.length || !options.upid.startsWith(`UPID:${options.node}:`)) throw Error('Enter the owning node and its complete UPID.');
                const base = `/nodes/${part(options.node)}/tasks/${part(options.upid)}`;
                report.status = await get(`${base}/status`);
                const lines = await get(`${base}/log`, { start: 0, limit: 5000 });
                report.rows = array(lines).map(l => ({ line: l.n, text: String(l.t ?? ''), errorLine: /\b(error|failed|fatal)\b/i.test(l.t || '') }));
                report.notes.push('First 5,000 log lines maximum; inspect the native task viewer for longer logs. Review identifiers and log text before sharing.');
            } else {
                const query = { limit: 500, source: 'all', since: Math.floor(Date.now() / 1000) - (options.days || 7) * 86400 };
                if (options.failuresOnly) query.errors = 1;
                if (options.taskType) query.typefilter = options.taskType;
                if (selected.length === 1) query.vmid = selected[0];
                await each(wantedNodes, async node => {
                    const tasks = await get(`/nodes/${part(node)}/tasks`, query);
                    if (array(tasks).length === 500) report.issues.push({ path: node, reason: '500-task limit reached; narrow the time range' });
                    for (const t of array(tasks)) if (!selected.length || selected.includes(String(t.id)))
                        report.rows.push({ ...pick(t, ['upid', 'id', 'type', 'status', 'starttime', 'endtime']), node });
                });
                report.rows.sort((a, b) => b.starttime - a.starttime);
                report.notes.push('Retention and permissions limit history. Group backup tasks may lack a guest ID and are omitted by guest filters. Use Copy Task Report with a row’s node and UPID to inspect its log.');
            }
        } else if (id === 'BACKUPS') {
            const jobs = await get('/cluster/backup');
            const backups = await visibleBackups();
            const tasks = [];
            await each(nodes, async node => tasks.push(...array(await get(`/nodes/${part(node)}/tasks`, { limit: 500, typefilter: 'vzdump', source: 'all' }))));
            await each(guests, async g => {
                const c = await config(g);
                const found = newestBackup(backups, g);
                const recent = tasks.filter(t => String(t.id) === String(g.vmid)).sort((a, b) => b.starttime - a.starttime)[0];
                report.rows.push({ ...identity(g), coverage: coverage(g, jobs), newestVisibleBackup: found ? pick(found, ['ctime', 'volid', 'storage', 'storageNode']) : null,
                    backupAgeDays: found && Number.isFinite(found.ctime) ? Math.floor((Date.now() / 1000 - found.ctime) / 86400) : null,
                    excludedAttachments: c ? mounts(c, g.type).filter(m => m.excluded) : null,
                    latestVisibleGuestBackupTask: recent ? pick(recent, ['starttime', 'status']) : null,
                    restoreTested: 'unknown', verification: 'unknown' });
            });
            report.notes.push('Backup identity is matched by VMID within this origin; reused IDs can refer to earlier guests. A found backup is not proof of successful restore. External copies, PBS verification, group-task outcomes and retention gaps may be invisible.');
        } else if (id === 'STORAGE') {
            const refs = new Map(), globalRefs = new Map();
            let complete = true;
            await each(allGuests, async g => {
                const c = await config(g);
                if (!c) { complete = false; return; }
                for (const m of mounts(c, g.type)) {
                    const key = `${g.node}/${m.volume}`;
                    if (!refs.has(key)) refs.set(key, []);
                    refs.get(key).push({ vmid: g.vmid, ...m });
                    if (!globalRefs.has(m.volume)) globalRefs.set(m.volume, []);
                    globalRefs.get(m.volume).push({ node: g.node, vmid: g.vmid, ...m });
                }
            });
            await each(wantedNodes, async node => {
                const stores = await get(`/nodes/${part(node)}/storage`, { enabled: 1 });
                await each(array(stores), async s => {
                    const contents = await get(`/nodes/${part(node)}/storage/${part(s.storage)}/content`);
                    for (const v of array(contents).filter(v => ['images', 'rootdir'].includes(v.content))) {
                        const localRefs = refs.get(`${node}/${v.volid}`) || [];
                        const sharedRefs = s.shared ? globalRefs.get(v.volid) || [] : [];
                        const matches = s.shared ? sharedRefs : localRefs;
                        report.rows.push({ node, storage: s.storage, volume: v.volid, provisionedBytes: v.size ?? null,
                            parentVolume: scalar(v.parent), references: matches, state: matches.some(r => !r.unused) ? 'attached' : matches.length ? 'marked unused' : 'no visible current-config reference',
                            safeToDelete: 'not determined', currentConfigScanComplete: complete });
                    }
                });
            });
            report.notes.push('No-reference volumes are candidates for investigation only. Snapshot, template, linked-clone, hidden-resource and external references are not exhaustively resolved. Provisioned size is not reclaimable capacity.');
        } else if (id === 'MAINTENANCE') {
            report.clusterStatus = await get('/cluster/status');
            const ha = await get('/cluster/ha/resources');
            report.haStatus = await get('/cluster/ha/status/current');
            const backups = await visibleBackups();
            const checks = new Map();
            await each(wantedNodes, async node => {
                const activeTasks = await get(`/nodes/${part(node)}/tasks`, { source: 'active', limit: 500 });
                if (array(activeTasks).length === 500) report.issues.push({ path: node, reason: '500-active-task limit reached; task evidence is incomplete' });
                const stores = await get(`/nodes/${part(node)}/storage`);
                const otherNodes = array(resources).filter(r => r.type === 'node' && (r.node || r.id?.replace(/^node\//, '')) !== node)
                    .map(r => ({ ...pick(r, ['node', 'status', 'maxmem', 'mem', 'cpu', 'maxcpu']), observedFreeMemoryBytes: Number.isFinite(r.maxmem) && Number.isFinite(r.mem) ? r.maxmem - r.mem : null }));
                checks.set(node, { node, activeTasks, storageAvailable: stores !== null,
                    selectedGuests: guests.filter(g => g.node === node).length, otherNodes,
                    shared: new Map(array(stores).map(s => [s.storage, !!s.shared])) });
            });
            report.nodePreflights = wantedNodes.map(node => {
                const { shared, ...check } = checks.get(node); return check;
            });
            if (wantedNodes.length === 1) {
                report.activeTasks = checks.get(wantedNodes[0]).activeTasks;
                report.otherNodes = checks.get(wantedNodes[0]).otherNodes;
            }
            await each(guests, async g => {
                const check = checks.get(g.node);
                if (!check) return; // Node cap: never infer a check for an uncollected node.
                const c = await config(g);
                const h = array(ha).find(h => h.sid === `${g.type === 'qemu' ? 'vm' : 'ct'}:${g.vmid}`);
                const backup = newestBackup(backups, g);
                report.rows.push({ ...identity(g), ha: ha === null ? 'unknown' : h ? h.state : 'not HA managed',
                    latestVisibleBackup: backup ? pick(backup, ['ctime', 'volid', 'storage']) : null,
                    localOrUnknownVolumes: c ? mounts(c, g.type).filter(m => !check.shared.get(m.volume.split(':')[0])) : null,
                    passthrough: c ? Object.entries(c).filter(([k]) => /^(hostpci|usb)\d+$/.test(k)) : null,
                    guestAgentConfigured: c ? scalar(c.agent) : null, migration: 'requires native checks' });
            });
            report.notes.push('Each selected node is assessed independently, including nodes with no visible guests. This is not a plan to take every node offline together.');
            report.notes.push('Backup evidence is limited to visible artifacts matched by VMID, not a tested restore. Observed free memory is not placement capacity. Native migration validation, HA rules, quorum and external service dependencies still govern the operation. No migration or reboot is performed.');
        } else if (id === 'NETWORK') {
            const net = new Map();
            await each(wantedNodes, async n => net.set(n, await get(`/nodes/${part(n)}/network`)));
            await each(guests, async g => report.rows.push(...networkPaths(g, await config(g), net.get(g.node))));
            report.interfaces = [...net].map(([node, data]) => ({ node, interfaces: data === null ? null : array(data).map(n => pick(n,
                ['iface', 'type', 'mtu', 'active', 'bridge_ports', 'slaves', 'bond_slaves', 'bridge_vlan_aware', 'bridge_vids', 'vlan-id', 'vlan-raw-device'])) }));
            const names = [...new Set([...net.values()].flatMap(list => array(list).map(n => n.iface)))];
            report.interfaceComparison = names.map(iface => ({ iface, nodes: [...net].map(([node, list]) => {
                const item = array(list).find(n => n.iface === iface);
                return { node, present: list === null ? null : !!item, mtu: scalar(item?.mtu), vlanAware: scalar(item?.bridge_vlan_aware) };
            }) }));
            report.notes.push('Configured topology only. Open vSwitch, SDN, switches and guest routing may require native tools. Compare interfaces by name and MTU across nodes before migration.');
        } else if (id === 'GUEST_HEALTH') {
            await each(guests.filter(g => g.type === 'qemu'), async g => {
                const c = await config(g);
                const agent = fields(c?.agent);
                const enabled = c ? agent.enabled === '1' || (agent.enabled === undefined && agent.volume === '1') : null;
                let response = 'not checked';
                if (options.checkAgent && enabled && g.status === 'running') {
                    const interfaces = await get(`${guestPath(g)}/agent/network-get-interfaces`);
                    response = interfaces === null ? 'unavailable; response not established' : 'responded to network information request';
                }
                report.rows.push({ ...identity(g), configured: enabled, responsiveness: response, agentOptions: scalar(c?.agent),
                    pending: array(await get(`${guestPath(g)}/pending`)).filter(p => ['agent', 'machine', 'bios'].includes(p.key)).map(p => pick(p, ['key', 'value', 'pending', 'delete'])) });
            });
            report.notes.push('Responsiveness is an explicit read-only guest-agent information request, not a guest command execution or guarantee of shutdown/backup success.');
        } else if (id === 'RECOVERY') {
            await each(guests, async g => { const c = await config(g); report.rows.push({ ...identity(g), configuration: c ? safeConfig(c) : null }); });
            report.storage = array(await get('/storage')).map(s => pick(s, ['storage', 'type', 'content', 'nodes', 'shared', 'path', 'server', 'export', 'pool', 'vgname', 'thinpool']));
            report.networks = [];
            await each(wantedNodes, async node => { const data = await get(`/nodes/${part(node)}/network`); report.networks.push({ node, interfaces: data === null ? null : array(data).map(n => pick(n,
                ['iface', 'type', 'address', 'netmask', 'gateway', 'cidr', 'bridge_ports', 'slaves', 'bond_slaves', 'mtu', 'bridge_vlan_aware'])) }); });
            report.ha = await get('/cluster/ha/resources');
            report.mappings = {};
            for (const type of ['pci', 'usb']) report.mappings[type] = array(await get(`/cluster/mapping/${type}`)).map(m => ({ id: scalar(m.id), map: array(m.map).filter(v => typeof v === 'string') }));
            report.checklist = ['Store guest backups separately and test restoration.', 'Back up actual host files and cluster configuration with an appropriate backup tool.',
                'Preserve encryption keys, credentials, firewall rules, certificates and custom scripts separately.', 'Record external DNS, switch configuration and application dependencies.',
                'Recreate storage and networking before restoring guests; review startup order.'];
            report.notes.push('Recovery documentation only. Not a host backup or an executable restore plan. Passwords, tokens, arbitrary arguments and descriptions are omitted.');
        } else throw Error('Unknown report feature.');
        return report;
    }
    return { run, scopeError, csv, safeConfig, configDiff, mounts, coverage, networkPaths, fields, guestPath };
})();
// Node tests load this file directly; this line is omitted from generated scripts.
if (typeof module !== 'undefined') module.exports = CatalogModel;
