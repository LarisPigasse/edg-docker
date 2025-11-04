import Docker from 'dockerode';

const docker = new Docker();

// Interfaccia per le informazioni dettagliate del container
interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  healthy: boolean;
  uptime: string;
  ports?: any;
}

// Interfaccia per la diagnostica completa
interface ArchitectureDiagnostics {
  timestamp: string;
  summary: {
    total_containers: number;
    running: number;
    stopped: number;
    healthy: number;
    unhealthy: number;
  };
  api_gateway: ContainerInfo | null;
  frontends: ContainerInfo[];
  microservices: ContainerInfo[];
  databases: ContainerInfo[];
  other: ContainerInfo[];
}

export async function listAllContainers() {
  return await docker.listContainers({ all: true });
}

export async function getContainerStats(containerId: string) {
  const container = docker.getContainer(containerId);
  return await container.inspect();
}

export async function restartContainer(containerId: string) {
  const container = docker.getContainer(containerId);
  await container.restart();
  return { success: true, message: `Container ${containerId} restarted` };
}

export async function startBackupGateway() {
  // Avvia nuova istanza dell'API Gateway
  const container = await docker.createContainer({
    Image: 'edg-docker-api-gateway',
    name: 'api-gateway-backup',
    HostConfig: {
      PortBindings: {
        '8080/tcp': [{ HostPort: '8081' }],
      },
    },
  });
  await container.start();
  return container.id;
}

/**
 * Controlla lo stato di salute di un container specifico
 * Ora supporta ricerca flessibile per nome parziale
 */
export async function checkContainerHealth(containerName: string) {
  const containers = await docker.listContainers();
  const container = containers.find(c => c.Names.some(name => name.includes(containerName)));

  if (!container) {
    return { healthy: false, status: 'not_found' };
  }

  return {
    healthy: container.State === 'running',
    status: container.Status,
    state: container.State,
  };
}

/**
 * Converte le informazioni raw di Docker in un formato più leggibile
 */
function parseContainerInfo(container: Docker.ContainerInfo): ContainerInfo {
  const name = container.Names[0]?.replace('/', '') || 'unknown';
  const isHealthy =
    container.State === 'running' && (container.Status.includes('healthy') || !container.Status.includes('unhealthy'));

  return {
    id: container.Id.substring(0, 12),
    name: name,
    image: container.Image,
    state: container.State,
    status: container.Status,
    healthy: isHealthy,
    uptime: container.Status,
    ports: container.Ports,
  };
}

/**
 * Rileva automaticamente tutti i frontend presenti nel sistema
 * Cerca container che contengono 'frontend' nel nome
 */
export async function detectFrontends(): Promise<ContainerInfo[]> {
  const containers = await docker.listContainers({ all: true });

  const frontends = containers
    .filter(c => c.Names.some(name => name.toLowerCase().includes('frontend')))
    .map(parseContainerInfo)
    .sort((a, b) => a.name.localeCompare(b.name));

  return frontends;
}

/**
 * Rileva automaticamente tutti i microservizi presenti nel sistema
 * Cerca container che contengono 'service' nel nome (esclusi quelli di sistema)
 */
export async function detectMicroservices(): Promise<ContainerInfo[]> {
  const containers = await docker.listContainers({ all: true });

  const microservices = containers
    .filter(c => {
      const name = c.Names[0]?.toLowerCase() || '';
      return name.includes('service') && !name.includes('frontend');
    })
    .map(parseContainerInfo)
    .sort((a, b) => a.name.localeCompare(b.name));

  return microservices;
}

/**
 * Rileva automaticamente tutti i database presenti nel sistema
 * Cerca container con immagini MySQL, MongoDB, PostgreSQL, Redis, etc.
 */
export async function detectDatabases(): Promise<ContainerInfo[]> {
  const containers = await docker.listContainers({ all: true });

  const dbKeywords = ['mysql', 'mongo', 'postgres', 'redis', 'mariadb', 'cassandra', 'elasticsearch'];

  const databases = containers
    .filter(c => {
      const image = c.Image.toLowerCase();
      const name = c.Names[0]?.toLowerCase() || '';
      return dbKeywords.some(keyword => image.includes(keyword) || name.includes(keyword));
    })
    .map(parseContainerInfo)
    .sort((a, b) => a.name.localeCompare(b.name));

  return databases;
}

/**
 * Trova l'API Gateway
 * Cerca container che contiene 'gateway' o 'api-gateway' nel nome
 */
export async function detectApiGateway(): Promise<ContainerInfo | null> {
  const containers = await docker.listContainers({ all: true });

  const gateway = containers.find(c => c.Names.some(name => name.toLowerCase().includes('gateway')));

  return gateway ? parseContainerInfo(gateway) : null;
}

/**
 * Esegue una diagnostica completa e intelligente dell'architettura Docker
 * Rileva automaticamente tutti i componenti del sistema EDG
 */
export async function diagnoseArchitecture(): Promise<ArchitectureDiagnostics> {
  const allContainers = await docker.listContainers({ all: true });

  // Rileva tutti i componenti
  const gateway = await detectApiGateway();
  const frontends = await detectFrontends();
  const microservices = await detectMicroservices();
  const databases = await detectDatabases();

  // Identifica i container non categorizzati
  const categorizedIds = new Set(
    [gateway?.id, ...frontends.map(f => f.id), ...microservices.map(m => m.id), ...databases.map(d => d.id)].filter(Boolean)
  );

  const other = allContainers.filter(c => !categorizedIds.has(c.Id.substring(0, 12))).map(parseContainerInfo);

  // Calcola statistiche
  const runningContainers = allContainers.filter(c => c.State === 'running');
  const healthyContainers = allContainers.filter(c => {
    const status = c.Status.toLowerCase();
    return c.State === 'running' && (status.includes('healthy') || !status.includes('unhealthy'));
  });

  return {
    timestamp: new Date().toISOString(),
    summary: {
      total_containers: allContainers.length,
      running: runningContainers.length,
      stopped: allContainers.length - runningContainers.length,
      healthy: healthyContainers.length,
      unhealthy: runningContainers.length - healthyContainers.length,
    },
    api_gateway: gateway,
    frontends: frontends,
    microservices: microservices,
    databases: databases,
    other: other,
  };
}

/**
 * Verifica lo stato di salute dell'intera architettura
 * Restituisce un report sintetico con eventuali problemi rilevati
 */
export async function getArchitectureHealthReport() {
  const diagnostics = await diagnoseArchitecture();
  const issues: string[] = [];

  // Controlla API Gateway
  if (!diagnostics.api_gateway) {
    issues.push('⚠️ API Gateway non trovato');
  } else if (!diagnostics.api_gateway.healthy) {
    issues.push(`⚠️ API Gateway non healthy: ${diagnostics.api_gateway.status}`);
  }

  // Controlla frontend
  const unhealthyFrontends = diagnostics.frontends.filter(f => !f.healthy);
  if (unhealthyFrontends.length > 0) {
    unhealthyFrontends.forEach(f => {
      issues.push(`⚠️ Frontend ${f.name} non healthy: ${f.status}`);
    });
  }

  // Controlla microservizi
  const unhealthyServices = diagnostics.microservices.filter(m => !m.healthy);
  if (unhealthyServices.length > 0) {
    unhealthyServices.forEach(m => {
      issues.push(`⚠️ Microservizio ${m.name} non healthy: ${m.status}`);
    });
  }

  // Controlla database
  const unhealthyDbs = diagnostics.databases.filter(d => !d.healthy);
  if (unhealthyDbs.length > 0) {
    unhealthyDbs.forEach(d => {
      issues.push(`⚠️ Database ${d.name} non healthy: ${d.status}`);
    });
  }

  return {
    healthy: issues.length === 0,
    issues: issues,
    summary: diagnostics.summary,
    timestamp: diagnostics.timestamp,
  };
}
