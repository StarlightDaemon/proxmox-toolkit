# Compatibility

[Project overview](../README.md) · [Installation](INSTALL.md) · [Test evidence](TESTING.md)

Toolkit 0.7.0 targets current stable Proxmox VE through its main HTTPS web
interface, using port 8006 by default. Firefox + Violentmonkey is the primary
development and maintainer-tested combination.

## Console and integration scope

| Surface | Scope |
| --- | --- |
| Embedded node Shell and LXC Console | Primary xterm console targets for both editions. |
| VM serial console | Toolkit opt-in; requires an accessible xterm serial console and verification in the installed environment. Copy & Paste does not include the serial extension. |
| Custom HTTPS origin or reverse-proxy path | Toolkit opt-in; configure the trusted-host rule, custom-origin setting and API prefix as described in the [catalog](CATALOG.md). Environment-specific qualification remains open. |
| Management reports | Toolkit only; read-only requests use the current Proxmox session and its permissions. Restricted or missing data can produce partial results or unknowns. |
| Graphical VM consoles using noVNC or SPICE | Outside the xterm clipboard integration. This does not exclude QEMU/KVM guests from management reports. |
| Separate console browser windows and PDM remote consoles | Outside the current integration scope. Use the embedded console in the main Proxmox VE interface. |

“Separate console browser windows” describes how the console is opened, not
Microsoft Windows compatibility. The maintainer's reported desktop is Windows 11.

## Browsers and userscript managers

The maintainer approved the tested 0.7.0-dev.8 workflow for stable 0.7.0.
The reported environment includes Proxmox VE 9.2.3, Firefox 159.0 (64-bit) and
Violentmonkey 2.50.0. These identify the observed environment; they are not
minimum-version requirements or a complete compatibility certification.

Earlier copy-only releases have practical reports for Firefox and Chrome with
Violentmonkey and Tampermonkey. Those reports do not qualify every 0.7.0 feature.
The local Chrome/ExtJS fixture checks synthetic UI and lifecycle behavior;
it does not establish live Chrome/userscript-manager or Proxmox compatibility.
Other Chromium browsers and additional managers require their own observations.

Use one edition in one manager. Follow the [installation guide](INSTALL.md)
for host restrictions, permissions, updates and rollback.

## Evidence and follow-up

[Testing](TESTING.md) retains exact versions, historical results and evidence
limits. The [catalog checklist](CATALOG-ACCEPTANCE.md) tracks detailed clipboard,
report/API, serial/proxy, migration and lifecycle checks. The
[maintenance register](OPEN-LOOPS.md) records remaining and conditional work.
