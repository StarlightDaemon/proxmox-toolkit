// One catalog feeds build selection, runtime settings and documentation checks.
const features = [
    ['COPY', 'Copy', 'Console', true, 'Copy retained console output to the clipboard.'],
    ['PASTE_ONLY', 'Paste Only', 'Console', true, 'Paste clipboard text without appending Enter.'],
    ['PASTE', 'Paste & Execute', 'Console', true, 'Paste clipboard text, then send Enter.'],
    ['EXPORT', 'Console Export', 'Console', false, 'Download retained output as text or Markdown.'],
    ['DIAGNOSTICS', 'Toolkit Diagnostics', 'Troubleshooting', false, 'Inspect console integration from the Tools menu.'],
    ['RECIPES', 'Diagnostic Recipes', 'Troubleshooting', false, 'Copy explained diagnostic commands from Tools.'],
    ['SCOPED', 'Scoped Copy', 'Console', false, 'Copy the viewport or a chosen number of recent lines.'],
    ['FIND', 'Find in Scrollback', 'Console', false, 'Search a snapshot of retained console output.'],
    ['REVIEW', 'Review & Paste', 'Console', false, 'Review and edit clipboard text before pasting.'],
    ['SERIAL', 'VM serial consoles', 'Integration', false, 'Allow clipboard tools in configured VM serial consoles.'],
    ['CUSTOM_PORT', 'Custom HTTPS origin / proxy path', 'Integration'],
    ['INVENTORY', 'Inventory & Report Builder', 'Inventory'],
    ['COMPARE', 'Guest Configuration Compare', 'Inventory'],
    ['BACKUPS', 'Backup Coverage & Recovery Gaps', 'Recovery'],
    ['TASKS', 'Task Failure Investigator', 'Troubleshooting'],
    ['TASK_REPORT', 'Copy Task Report', 'Troubleshooting'],
    ['SNAPSHOTS', 'Snapshot Age & Review Ledger', 'Recovery'],
    ['STORAGE', 'Storage Reference & Unused-Disk Inspector', 'Inventory'],
    ['MAINTENANCE', 'Node Maintenance Preflight', 'Maintenance'],
    ['NETWORK', 'Network Path Explorer', 'Troubleshooting'],
    ['GUEST_HEALTH', 'Guest Integration Health Check', 'Maintenance'],
    ['RECOVERY', 'Recovery Manifest & Rebuild Checklist', 'Recovery'],
].map(([id, name, group, defaultOn = false, description = '']) => ({ id, name, group, defaultOn, description }));
const reports = features.slice(11).map(f => f.id);
module.exports = { features, reports };
