import type { SceneKind, SceneProp, Specialty } from '../types';

/** Pequeñas filtraciones de la fase «Rumores en los pasillos». */
export const RUMORS: string[] = [
  'Fuentes de pasillo sitúan a {name} junto a la máquina de café con un portátil sin pegatinas.',
  'Un periodista pregunta a {name} por un ticket que lleva 12 días «In Progress».',
  'Circula por Twitter un pantallazo borroso del tablero de Jira de {name}.',
  'La oposición registra una pregunta escrita sobre el último merge de {name}.',
  'Se detecta actividad inusual en la rama `feature/sobres` del repositorio.',
  'Un becario comenta que {name} cierra la tapa del portátil cada vez que pasa alguien.',
  'Aparece un commit de {name} con el mensaje «arreglos varios (no preguntar)».',
  'Un tertuliano asegura tener «información muy delicada» sobre {cargo}.',
  'Se rumorea que {name} tiene una segunda cuenta de GitHub.',
  'El canal #random se llena de emojis de ojos tras la intervención de {name}.',
  'Alguien ha visto a {name} buscando «cómo borrar un commit ya pusheado».',
  'Un medio digital publica que {name} cobra en story points.',
];

/** Noticias persistentes: implican a quien habla con escándalos anteriores. */
export const PERSISTENT_DENIALS: string[] = [
  '{name} comparece ante la prensa y niega conocer los contratos adjudicados por {prev}.',
  '{name} asegura que solo coincidió con {prev} en una retrospectiva.',
  '{name} declara que «no tiene relación con {prevCompany} más allá de algún code review».',
  '{name} pide «respeto a la presunción de inocencia» de {prev} sin que nadie le pregunte.',
];

export const PERSISTENT_IMPLICATIONS: string[] = [
  'Aparecen conversaciones de Slack que vinculan a {name} con las adjudicaciones de {prevCompany}.',
  '{name} confirma que los servidores investigados en el caso de {prev} fueron eliminados durante una supuesta migración a Kubernetes.',
  'La UCO halla el nombre de {name} en la agenda de {prev}, junto a la palabra «maletín».',
  'Un correo revela que {name} aprobó, sin leerlo, el PR que enriqueció a {prevCompany}.',
  '{prev} acusa a {name} desde la Audiencia Nacional: «Yo solo hice el merge».',
];

export const REOPEN_TEMPLATES: string[] = [
  'La UCO reabre el {caseTitle} descubierto hace {n} sesiones.',
  'Nuevas pruebas reactivan el {caseTitle}, archivado hace {n} sesiones.',
];

/** Cartas de crisis extraordinarias. */
export interface CrisisCard {
  id: string;
  icon: string;
  title: string;
  text: string;
  scene: SceneKind;
  props: SceneProp[];
  accent: string;
  sign: string;
  screen: string;
}

export const CRISIS_CARDS: CrisisCard[] = [
  { id: 'produccion', icon: '🚨', title: 'OPERACIÓN PRODUCCIÓN', text: 'Un desarrollador acaba de hacer un deploy en viernes. El presidente convoca un Consejo de Ministros extraordinario.', scene: 'datacenter', props: ['servers', 'police'], accent: '#ff1744', sign: 'PROD', screen: 'DEPLOY: viernes 18:47' },
  { id: 'dependencias', icon: '💰', title: 'AUDITORÍA DE DEPENDENCIAS', text: 'La UCO descubre que el paquete `is-even` costó al contribuyente 470.000 €.', scene: 'hq', props: ['boxes', 'money'], accent: '#cb3837', sign: 'is-even S.A.', screen: 'npm i is-even' },
  { id: 'testigo', icon: '🔴', title: 'EL TESTIGO PROTEGIDO', text: 'Un becario afirma haber visto cómo {name} aprobaba un PR sin revisar los cambios.', scene: 'court', props: ['laptop', 'envelopes'], accent: '#ff4136', sign: 'Audiencia Nacional', screen: 'PR #4521 approved' },
  { id: 'localhost', icon: '🏦', title: 'LOS PAPELES DE LOCALHOST', text: 'La Fiscalía descubre cuentas bancarias ocultas en un servidor que únicamente era accesible desde localhost.', scene: 'island', props: ['servers', 'money'], accent: '#29b6f6', sign: '127.0.0.1 Bank', screen: 'http://localhost:3000' },
  { id: 'secretos', icon: '🔓', title: 'EL .ENV FILTRADO', text: 'Aparece en un repositorio público el `.env` del Gobierno, con la contraseña `admin123` y un IBAN.', scene: 'office', props: ['monitor', 'envelopes'], accent: '#ffcc00', sign: '.env S.L.', screen: 'PASSWORD=admin123' },
  { id: 'certificado', icon: '📜', title: 'CRISIS DEL CERTIFICADO', text: 'Caduca el certificado SSL del Ministerio. Nadie sabe quién lo renovaba: el responsable era {name}.', scene: 'court', props: ['monitor', 'boxes'], accent: '#2ecc71', sign: 'SSL Expired S.A.', screen: 'NET::ERR_CERT_DATE_INVALID' },
];

/** Generador de corruptelas: [PERSONA] + [DELITO] + [TECNOLOGÍA] + [EMPRESA] + [EXCUSA]. */
export const GEN_TEMPLATES: string[] = [
  'La UCO investiga a {name} por desviar {amount} mediante {tech} a la empresa {company}. Su gabinete asegura que {excuse}.',
  '{name} habría adjudicado {amount} a {company} para desarrollar {deliverable}. Fuentes del ministerio afirman que {excuse}.',
  'Anticorrupción cita a {name}, {cargo}, por facturar {amount} a {company} en concepto de {deliverable}. Su defensa alega que {excuse}.',
  'Hacienda detecta pagos de {company} a {name} por valor de {amount} a través de {tech}. El portavoz insiste en que {excuse}.',
];

export const GEN_TECH: Record<Specialty | 'general', string[]> = {
  backend: ['una API REST', 'un endpoint GraphQL sin autenticación', 'un cron job nocturno', 'una cola de RabbitMQ'],
  frontend: ['un iframe invisible', 'un formulario con `autocomplete="off"`', 'un pixel de tracking', 'un service worker'],
  fullstack: ['un monolito modular', 'una integración "temporal"', 'un webhook sin firmar'],
  devops: ['un pipeline de CI/CD', 'un bucket de S3 público', 'una Lambda huérfana', 'un contenedor sin límites de memoria'],
  qa: ['un entorno de pruebas', 'tests end-to-end que nadie ejecuta', 'un mock de la Agencia Tributaria'],
  techlead: ['un ADR firmado a escondidas', 'una prueba de concepto que acabó en producción'],
  po: ['un backlog paralelo', 'una "épica estratégica"', 'un OKR inventado'],
  scrum: ['retrospectivas sin acta', 'un tablero Kanban secreto', 'una ceremonia ágil extraordinaria'],
  architect: ['un patrón Saga', 'un event bus distribuido', 'una capa de abstracción adicional'],
  data: ['un pipeline ETL', 'una vista materializada', 'un dashboard de Power BI', 'un modelo de machine learning'],
  general: ['una hoja de Excel compartida', 'un repositorio privado', 'un script de bash'],
};

export const GEN_COMPANIES: string[] = [
  'Cache & Maletines S.L.',
  'Display None Consulting S.A.',
  'Sobres As A Service Inc.',
  'Merge Conflict Partners',
  'Legacy Code Inversiones S.L.',
  'Stack Overflow Patrimonial',
  'Lambda & Primos S.L.',
  'Hotfix Express Global',
  'Deuda Técnica Holdings',
  'Localhost Capital Partners',
];

export const GEN_DELIVERABLES: string[] = [
  'un modal',
  'un spinner de carga',
  'una landing page sin contenido',
  'un botón de "Aceptar cookies"',
  'un microservicio que suma dos números',
  'una migración de jQuery a jQuery',
  'un README',
  'un favicon',
  'un dashboard que nadie abre',
  'un chatbot que solo responde «no sé»',
];

export const GEN_EXCUSES: string[] = [
  'todo responde a un problema de sincronización',
  'el botón de cerrar todavía está en desarrollo',
  'era un entorno de pruebas',
  'el dinero está cacheado y se invalidará pronto',
  'la documentación estaba desactualizada',
  'fue un error de zona horaria',
  'en su máquina funcionaba',
  'se trata de deuda técnica heredada',
  'era un feature flag desactivado',
  'el log se rotó antes de tiempo',
];

/** Frases para el escándalo nacional. */
export const NATIONAL_SCANDAL_LINES: string[] = [
  'Detenciones, dimisiones y registros: la Guardia Civil precinta la sala de reuniones mientras {name} sigue hablando.',
  'Los agentes se llevan los portátiles del equipo. {name} pide «cinco minutos más» para terminar su update.',
  'La Audiencia Nacional decreta el secreto de sumario sobre el ticket que está explicando {name}.',
];
