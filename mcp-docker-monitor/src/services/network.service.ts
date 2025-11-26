import Docker from 'dockerode';

const docker = new Docker();

/**
 * Network & Volumes Service
 * Gestisce ispezione rete, test connettività e gestione volumi
 */

// ============================================
// NETWORK FUNCTIONS
// ============================================

/**
 * Ispeziona la configurazione di rete di un container
 */
export async function inspectNetwork(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();

    const networks = info.NetworkSettings.Networks;

    let output = `=== Network Configuration for ${info.Name.replace('/', '')} ===\n\n`;

    if (Object.keys(networks).length === 0) {
      output += '⚠️  No networks attached\n';
      return output;
    }

    for (const [networkName, networkData] of Object.entries(networks)) {
      output += `📡 Network: ${networkName}\n`;
      output += `   IP Address:    ${networkData.IPAddress || 'N/A'}\n`;
      output += `   Gateway:       ${networkData.Gateway || 'N/A'}\n`;
      output += `   MAC Address:   ${networkData.MacAddress || 'N/A'}\n`;
      output += `   Network ID:    ${networkData.NetworkID?.substring(0, 12) || 'N/A'}\n`;

      if (networkData.Aliases && networkData.Aliases.length > 0) {
        output += `   Aliases:       ${networkData.Aliases.join(', ')}\n`;
      }

      output += '\n';
    }

    // Porte esposte
    const ports = info.NetworkSettings.Ports;
    if (ports && Object.keys(ports).length > 0) {
      output += '🔌 Port Mappings:\n';
      for (const [containerPort, hostBindings] of Object.entries(ports)) {
        if (hostBindings && hostBindings.length > 0) {
          const hostPorts = hostBindings.map((b: any) => `${b.HostIp || '0.0.0.0'}:${b.HostPort}`).join(', ');
          output += `   ${containerPort} → ${hostPorts}\n`;
        } else {
          output += `   ${containerPort} (not mapped)\n`;
        }
      }
    }

    return output;
  } catch (error: any) {
    return `❌ Error inspecting network: ${error.message}`;
  }
}

/**
 * Testa la connettività tra container usando ping
 */
export async function testConnectivity(sourceContainerId: string, targetContainerIdOrName: string) {
  try {
    const sourceContainer = docker.getContainer(sourceContainerId);
    const sourceInfo = await sourceContainer.inspect();
    const sourceName = sourceInfo.Name.replace('/', '');

    // Verifica che il target esista
    let targetName: string;
    try {
      const targetContainer = docker.getContainer(targetContainerIdOrName);
      const targetInfo = await targetContainer.inspect();
      targetName = targetInfo.Name.replace('/', '');
    } catch {
      targetName = targetContainerIdOrName;
    }

    let output = `=== Connectivity Test ===\n`;
    output += `Source: ${sourceName}\n`;
    output += `Target: ${targetName}\n\n`;

    // Esegue ping
    const exec = await sourceContainer.exec({
      Cmd: ['ping', '-c', '3', '-W', '2', targetName],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    return new Promise<string>(resolve => {
      let result = '';

      stream.on('data', (chunk: Buffer) => {
        result += chunk.toString('utf8');
      });

      stream.on('end', () => {
        // Parsing risultato ping
        if (result.includes('0 received') || result.includes('100% packet loss')) {
          output += '❌ Connection FAILED (0 packets received)\n';
          output += '\nRaw output:\n';
          output += result;
          resolve(output);
        } else if (result.includes('packets transmitted')) {
          const match = result.match(/(\d+) packets transmitted, (\d+) received/);
          if (match) {
            const sent = match[1];
            const received = match[2];
            const loss = (((parseInt(sent) - parseInt(received)) / parseInt(sent)) * 100).toFixed(0);

            output += `✅ Connection OK\n`;
            output += `   Packets: ${sent} sent, ${received} received (${loss}% loss)\n`;

            // Estrai tempo medio
            const timeMatch = result.match(/min\/avg\/max[^=]*= [\d.]+\/([\d.]+)\//);
            if (timeMatch) {
              output += `   Avg time: ${timeMatch[1]} ms\n`;
            }
          }
          resolve(output);
        } else {
          output += '⚠️  Unexpected ping output\n\n';
          output += result;
          resolve(output);
        }
      });

      stream.on('error', (err: Error) => {
        resolve(`❌ Error during ping: ${err.message}`);
      });
    });
  } catch (error: any) {
    return `❌ Error testing connectivity: ${error.message}`;
  }
}

// ============================================
// VOLUMES FUNCTIONS
// ============================================

/**
 * Lista tutti i volumi Docker
 */
export async function listVolumes() {
  try {
    const volumesData = await docker.listVolumes();
    const volumes = volumesData.Volumes || [];

    let output = `=== Docker Volumes ===\n`;
    output += `Total: ${volumes.length} volumes\n\n`;

    if (volumes.length === 0) {
      output += 'No volumes found.\n';
      return output;
    }

    // Raggruppa per driver
    const byDriver: { [key: string]: any[] } = {};
    volumes.forEach(vol => {
      const driver = vol.Driver || 'unknown';
      if (!byDriver[driver]) byDriver[driver] = [];
      byDriver[driver].push(vol);
    });

    for (const [driver, vols] of Object.entries(byDriver)) {
      output += `\n📦 Driver: ${driver} (${vols.length} volumes)\n`;
      output += '─'.repeat(50) + '\n';

      vols.forEach(vol => {
        const name = vol.Name.length > 40 ? vol.Name.substring(0, 37) + '...' : vol.Name;

        output += `\n   Name: ${name}\n`;
        output += `   Mountpoint: ${vol.Mountpoint}\n`;

        if (vol.Labels && Object.keys(vol.Labels).length > 0) {
          output += `   Labels: ${JSON.stringify(vol.Labels)}\n`;
        }

        output += `   Created: ${vol.CreatedAt || 'N/A'}\n`;
      });
    }

    return output;
  } catch (error: any) {
    return `❌ Error listing volumes: ${error.message}`;
  }
}

/**
 * Analizza l'utilizzo dello spazio dei volumi
 */
export async function volumeUsage() {
  try {
    const volumesData = await docker.listVolumes();
    const volumes = volumesData.Volumes || [];

    let output = `=== Volume Usage Analysis ===\n`;
    output += `Total volumes: ${volumes.length}\n\n`;

    if (volumes.length === 0) {
      output += 'No volumes found.\n';
      return output;
    }

    // Usa docker system df per info aggregate
    try {
      const dfInfo = await docker.df();

      output += '📊 System Storage Overview:\n';
      output += '─'.repeat(50) + '\n\n';

      // Volumes summary
      if (dfInfo.Volumes) {
        let totalSize = 0;
        let reclaimable = 0;

        dfInfo.Volumes.forEach((vol: any) => {
          if (vol.UsageData) {
            totalSize += vol.UsageData.Size || 0;
            if (vol.UsageData.RefCount === 0) {
              reclaimable += vol.UsageData.Size || 0;
            }
          }
        });

        output += `Total Size:      ${formatBytes(totalSize)}\n`;
        output += `Reclaimable:     ${formatBytes(reclaimable)}\n`;
        output += `In Use:          ${formatBytes(totalSize - reclaimable)}\n\n`;
      }

      // Volume details con usage
      output += '📦 Volume Details:\n';
      output += '─'.repeat(50) + '\n';

      const sortedVolumes = dfInfo.Volumes.sort((a: any, b: any) => {
        const sizeA = a.UsageData?.Size || 0;
        const sizeB = b.UsageData?.Size || 0;
        return sizeB - sizeA;
      });

      sortedVolumes.forEach((vol: any, index: number) => {
        if (index >= 20) return; // Limita a top 20

        const name = vol.Name.length > 35 ? vol.Name.substring(0, 32) + '...' : vol.Name;

        const size = vol.UsageData?.Size || 0;
        const refCount = vol.UsageData?.RefCount || 0;
        const status = refCount > 0 ? '✓ in-use' : '○ unused';

        output += `\n${String(index + 1).padStart(2)}. ${name}\n`;
        output += `    Size: ${formatBytes(size).padEnd(10)} ${status} (${refCount} refs)\n`;
      });

      if (sortedVolumes.length > 20) {
        output += `\n... and ${sortedVolumes.length - 20} more volumes\n`;
      }
    } catch (err: any) {
      output += `\n⚠️  Could not retrieve detailed usage: ${err.message}\n`;
    }

    return output;
  } catch (error: any) {
    return `❌ Error analyzing volume usage: ${error.message}`;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
