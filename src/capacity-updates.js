// On-demand capacity and package evidence; no background collection or mutations.
const CapacityUpdates = (() => {
    const list = value => Array.isArray(value) ? value : [];
    const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
    const text = value => typeof value === 'string' ? value : null;
    const flag = value => value === true || value === 1 || value === '1' ? true : value === false || value === 0 || value === '0' ? false : null;
    const encoded = value => encodeURIComponent(String(value));
    const ratio = (a, b) => number(a) !== null && number(b) !== null && b > 0 ? number(a / b) : null;
    const positiveInteger = value => Number.isSafeInteger(value) && value > 0 ? value : null;
    function guestAllocation(config, type) {
        if (!config) return { memoryMiB: null, vcpus: null, maximumVCPUs: null, memorySource: 'unavailable', cpuSource: 'unavailable' };
        let memoryMiB = positiveInteger(config.memory);
        let memorySource = memoryMiB !== null ? 'explicit configuration' : config.memory === undefined ? 'memory not configured; no allocation inferred' : 'unsupported memory value';
        if (type === 'qemu' && config.memory === undefined) { memoryMiB = 512; memorySource = 'documented QEMU default: 512 MiB'; }
        else if (type === 'qemu' && typeof config.memory === 'string') {
            // PVE's current memory property is the online maximum for ballooning;
            // do not infer future/unrecognized hotplug properties from this value.
            const match = config.memory.match(/^(?:current=)?(\d+)$/);
            memoryMiB = match ? positiveInteger(Number(match[1])) : null;
            memorySource = memoryMiB === null ? 'unsupported memory property' : 'QEMU memory current property';
        }
        if (type !== 'qemu') return { memoryMiB, vcpus: positiveInteger(config.cores), maximumVCPUs: positiveInteger(config.cores), memorySource, cpuSource: config.cores === undefined ? 'unlimited or unspecified container cores; no allocation inferred' : 'explicit configuration' };
        const cores = config.cores === undefined ? 1 : positiveInteger(config.cores);
        const sockets = config.sockets === undefined ? config.smp === undefined ? 1 : positiveInteger(config.smp) : positiveInteger(config.sockets);
        const maximumVCPUs = cores === null || sockets === null ? null : positiveInteger(cores * sockets);
        const selectedVCPUs = config.vcpus === undefined ? maximumVCPUs : positiveInteger(config.vcpus);
        const vcpus = maximumVCPUs !== null && selectedVCPUs !== null && selectedVCPUs <= maximumVCPUs ? selectedVCPUs : null;
        return { memoryMiB, vcpus, maximumVCPUs, memorySource,
            cpuSource: `QEMU ${config.vcpus === undefined ? 'topology allocation' : 'explicit online vcpus'}; ${config.cores === undefined || (config.sockets === undefined && config.smp === undefined) ? 'documented missing cores/sockets default to 1' : 'explicit topology'}` };
    }
    function metric(samples, key) {
        const points = list(samples).filter(s => object(s) && number(s.time) !== null && number(s[key]) !== null)
            .map(s => ({ time: s.time, value: s[key] })).sort((a, b) => a.time - b.time);
        if (!points.length) return { samples: 0, average: null, peak: null, firstTime: null, lastTime: null, change: null };
        return { samples: points.length, average: points.reduce((n, s) => n + s.value / points.length, 0),
            peak: points.reduce((n, s) => Math.max(n, s.value), 0), firstTime: points[0].time, lastTime: points.at(-1).time,
            change: points.at(-1).time > points[0].time ? points.at(-1).value - points[0].value : null };
    }
    async function history(get, path, timeframe, keys) {
        const average = await get(path, { timeframe, cf: 'AVERAGE' });
        const maximum = await get(path, { timeframe, cf: 'MAX' });
        return Object.fromEntries(keys.map(key => {
            const a = metric(average, key), m = metric(maximum, key);
            return [key, { average: a.average, peak: m.peak, averageSamples: a.samples, maximumSamples: m.samples,
                firstTime: a.firstTime, lastTime: a.lastTime, observedChange: a.change }];
        }));
    }
    async function capacity(ctx) {
        const { report, get, guests, nodes, config, each, identity, resources, options } = ctx;
        const timeframe = options.timeframe ?? 'week';
        const reservePercent = options.reservePercent ?? 20;
        if (!['day', 'week', 'month', 'year'].includes(timeframe)) throw Error('Choose day, week, month or year for capacity history.');
        if (typeof reservePercent !== 'number' || !Number.isFinite(reservePercent) || reservePercent < 0 || reservePercent > 90)
            throw Error('Choose a host memory reserve from 0 to 90 percent.');
        report.timeframe = timeframe;
        report.reservePercent = reservePercent;
        const allocations = new Map(nodes.map(node => [node, []]));
        const guestRows = new Map();
        await each(guests, async guest => {
            const c = object(await config(guest));
            const allocation = guestAllocation(c, guest.type), { memoryMiB, vcpus } = allocation;
            const row = { kind: 'guest', ...identity(guest), configuredMemoryBytes: memoryMiB === null ? null : number(memoryMiB * 1048576),
                configuredVCPUs: number(vcpus), observedMemoryBytes: number(guest.mem), observedCPUFraction: number(guest.cpu),
                configurationAvailable: !!c, maximumTopologyVCPUs: allocation.maximumVCPUs,
                memoryConfigurationSource: allocation.memorySource, cpuConfigurationSource: allocation.cpuSource };
            allocations.get(guest.node)?.push(row);
            guestRows.set(`${guest.type}/${guest.vmid}`, row);
        });
        if (options.signal?.aborted) return;
        const nodeRows = new Map(), storageRows = [];
        // Node and storage histories keep request counts proportional to infrastructure,
        // rather than two more history calls for every guest in a large inventory.
        await each(nodes, async node => {
            const path = `/nodes/${encoded(node)}`;
            const status = object(await get(`${path}/status`, {}, 'object'));
            const resource = list(resources).find(r => object(r) && r.type === 'node' && (r.node || (typeof r.id === 'string' ? r.id.replace(/^node\//, '') : null)) === node);
            const selected = allocations.get(node) || [];
            const total = number(status?.memory?.total) ?? number(resource?.maxmem);
            const used = number(status?.memory?.used) ?? number(resource?.mem);
            const cpus = number(status?.cpuinfo?.cpus) ?? number(resource?.maxcpu);
            const memoryComplete = selected.every(r => r.configuredMemoryBytes !== null);
            const cpuComplete = selected.every(r => r.configuredVCPUs !== null);
            const allocated = memoryComplete ? number(selected.reduce((n, r) => n + r.configuredMemoryBytes, 0)) : null;
            const vcpus = cpuComplete ? number(selected.reduce((n, r) => n + r.configuredVCPUs, 0)) : null;
            const historical = await history(get, `${path}/rrddata`, timeframe, ['cpu', 'memused', 'memavailable']);
            nodeRows.set(node, { kind: 'node', node, selectedVisibleGuests: selected.length,
                configuredMemoryBytes: number(allocated), configuredVCPUs: number(vcpus), hostMemoryBytes: total,
                observedMemoryBytes: used, observedAvailableMemoryBytes: number(status?.memory?.available), hostLogicalCPUs: cpus,
                selectedMemoryAllocationRatio: ratio(allocated, total), selectedCPUAllocationRatio: ratio(vcpus, cpus),
                allocationBalanceAfterReserveBytes: total !== null && allocated !== null ? total * (1 - reservePercent / 100) - allocated : null,
                observedBalanceAfterReserveBytes: total !== null && used !== null ? total * (1 - reservePercent / 100) - used : null,
                historical, allocationScope: 'Selected visible guests only; includes stopped guests and templates; not placement capacity' });
            const stores = await get(`${path}/storage`);
            if (stores === null) storageRows.push({ kind: 'storage', node, storage: null, state: 'Storage list unavailable' });
            if (list(stores).some(s => !object(s) || typeof s.storage !== 'string')) {
                report.issues.push({ path: `${path}/storage`, reason: 'Malformed storage entries omitted; storage evidence is incomplete' });
                storageRows.push({ kind: 'storage', node, storage: null, state: 'Malformed storage entries; coverage incomplete' });
            }
            await each(list(stores).filter(s => object(s) && typeof s.storage === 'string'), async store => {
                const active = flag(store.active), enabled = flag(store.enabled);
                const historical = active === true && enabled !== false ?
                    await history(get, `${path}/storage/${encoded(store.storage)}/rrddata`, timeframe, ['used', 'total']) : null;
                storageRows.push({ kind: 'storage', node, storage: store.storage, shared: flag(store.shared), active, enabled,
                    capacityBytes: number(store.total), usedBytes: number(store.used), availableBytes: number(store.avail),
                    utilizationRatio: ratio(number(store.used), number(store.total)), historical,
                    aggregation: 'Per-node observation; shared stores and aliases are not summed' });
            });
        });
        if (options.signal?.aborted) return;
        report.rows.push(...nodes.map(node => nodeRows.get(node)), ...[...guestRows.values()].sort((a, b) => a.node.localeCompare(b.node) || a.vmid - b.vmid),
            ...storageRows.sort((a, b) => a.node.localeCompare(b.node) || String(a.storage).localeCompare(String(b.storage))));
        report.notes.push('Allocation ratios use selected visible guest configurations, not physical reservations. Missing configurations keep totals unknown. Guest filters do not restrict host utilization or storage observations.');
        report.notes.push('QEMU allocation supports numeric memory and the current property, plus documented defaults for omitted memory (512 MiB), cores (1) and sockets (1). Explicit online vcpus are separate from maximum topology. Unknown memory properties and unspecified container cores stay unknown.');
        report.notes.push('Historical values summarize finite RRD samples: averages are means of AVERAGE buckets and peaks are maxima of MAX buckets. Missing intervals are not zeros; historical peaks need not occur together. No growth or exhaustion forecast is inferred.');
        report.notes.push('Reserve is a user-selected planning allowance, not a Proxmox requirement. Ballooning, host services, caches, passthrough and workload bursts affect actual capacity. Node memory may differ from guest-reported consumption. No workload is resized or moved.');
        report.notes.push('Storage observations are never summed: shared stores, aliases and backing pools can overlap. No reclaimable-space or safe-deletion conclusion is made.');
    }
    function packages(data, installed) {
        if (!Array.isArray(data)) return null;
        if (data.some(p => !object(p) || typeof p.Package !== 'string' || !/^[a-z0-9][a-z0-9+.-]*(?::[a-z0-9-]+)?$/.test(p.Package) || typeof p.Version !== 'string')) return null;
        return data.map(p => ({
            package: p.Package, installedVersion: text(p.OldVersion), candidateVersion: text(p.Version),
            ...(installed ? { state: text(p.CurrentState), runningKernel: text(p.RunningKernel), managerVersion: text(p.ManagerVersion) } : {}),
        })).sort((a, b) => a.package.localeCompare(b.package));
    }
    function repositories(data) {
        if (!object(data) || !Array.isArray(data.files)) return null;
        if (data.files.some(file => !object(file) || !Array.isArray(file.repositories) || file.repositories.some(repo => !object(repo)))) return null;
        const rows = [];
        for (const file of data.files) for (const repo of list(file?.repositories)) {
            if (!object(repo)) continue;
            rows.push({ enabled: flag(repo.Enabled),
                types: list(repo.Types).filter(v => typeof v === 'string'),
                suites: list(repo.Suites).filter(v => typeof v === 'string'),
                components: list(repo.Components).filter(v => typeof v === 'string'),
                origins: [...new Set(list(repo.URIs).map(uri => {
                    try { const url = new URL(uri); return ['http:', 'https:'].includes(url.protocol) ? url.origin : 'non-HTTP repository'; }
                    catch { return 'unparsed repository'; }
                }))].sort() });
        }
        // Raw parser errors, file paths, URI paths/queries and options may contain secrets.
        return { entries: rows, parserErrorCount: Array.isArray(data.errors) ? data.errors.length : null };
    }
    async function updates(ctx) {
        const { report, get, nodes, each, options } = ctx;
        const results = new Map();
        await each(nodes, async node => {
            const path = `/nodes/${encoded(node)}`;
            const rawVersions = await get(`${path}/apt/versions`);
            const versions = packages(rawVersions, true);
            const rawUpdates = await get(`${path}/apt/update`);
            const available = packages(rawUpdates, false);
            const rawRepositories = await get(`${path}/apt/repositories`, {}, 'object');
            const repository = repositories(rawRepositories);
            for (const [suffix, raw, parsed] of [['versions', rawVersions, versions], ['update', rawUpdates, available], ['repositories', rawRepositories, repository]])
                if (raw !== null && parsed === null) report.issues.push({ path: `${path}/apt/${suffix}`, reason: 'Unexpected package or repository data; evidence unavailable' });
            const status = object(await get(`${path}/status`, {}, 'object'));
            const pve = versions?.find(p => p.package === 'pve-manager');
            const running = text(status?.['current-kernel']?.release) ?? versions?.find(p => p.runningKernel)?.runningKernel ?? null;
            const kernelReleases = versions === null ? null : [...new Set(versions.filter(p => p.state === 'Installed')
                .map(p => p.package.match(/^(?:proxmox|pve)-kernel-(\d[\w.+~-]*-pve)(?:-signed)?$/)?.[1]).filter(Boolean))].sort();
            const review = !running || kernelReleases === null || !kernelReleases.length ? 'Unknown; kernel evidence incomplete' :
                kernelReleases.some(k => k !== running) ? 'Other installed kernels found; review boot selection and maintenance needs' :
                    'Running kernel matches the only visible installed kernel release; reboot need not established';
            results.set(node, { node, installedManagerVersion: pve?.state === 'Installed' ? pve.installedVersion : null,
                runningManagerVersion: pve?.managerVersion ?? null, runningKernel: running,
                availableUpdateCount: available?.length ?? null, packageIndexFreshness: 'Unknown; local APT data only',
                repositoryCount: repository?.entries.length ?? null, repositoryParserErrors: repository?.parserErrorCount ?? null,
                kernelReview: review, installedKernelReleases: kernelReleases, packages: versions, availableUpdates: available, repositories: repository });
        });
        if (options.signal?.aborted) return;
        report.rows.push(...nodes.map(node => {
            const { packages: ignoredPackages, availableUpdates: ignoredUpdates, repositories: ignoredRepositories, ...row } = results.get(node);
            return row;
        }));
        report.nodePackages = nodes.map(node => ({ node, packages: results.get(node).packages, availableUpdates: results.get(node).availableUpdates,
            repositories: results.get(node).repositories }));
        const names = [...new Set(report.nodePackages.flatMap(n => list(n.packages).map(p => p.package)))].sort();
        report.versionDifferences = names.map(name => ({ package: name, nodes: nodes.map(node => {
            const p = results.get(node).packages?.find(p => p.package === name);
            return { node, installedVersion: p?.state === 'Installed' ? p.installedVersion : null, state: p?.state ?? 'unknown / not returned' };
        }) })).filter(p => new Set(p.nodes.filter(n => n.installedVersion !== null).map(n => n.installedVersion)).size > 1);
        report.notes.push('Installed package versions use OldVersion from the Proxmox API; Version is the candidate version. Differences show distinct observed installed versions, not upgrade ordering or compatibility. Missing packages or denied nodes stay unknown.');
        report.notes.push('Available updates come from local APT data. Its age is not established; zero listed updates does not prove a fully patched system. Collection never refreshes repository indexes, installs packages, changes repositories or reboots.');
        report.notes.push('Additional installed kernels may be deliberate fallbacks or pins. No bootloader selection, service restart requirement, security-patch classification or definitive reboot requirement is inferred. Use native maintenance checks before acting.');
        report.notes.push('Repository exports contain only enablement, types, suites, components and HTTP(S) origins; credentials, URI paths/queries, options and raw parser messages are omitted.');
    }
    return { capacity, updates };
})();
if (typeof module !== 'undefined') module.exports = CapacityUpdates;
