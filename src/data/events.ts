import type { Severity, Tag } from '../types';

/** Eventos aleatorios que aparecen una vez superado el threshold. */
export interface EventDef {
  id: string;
  icon: string;
  kicker: string;
  severity: Severity;
  tags: Tag[];
  text: string;
  disks?: number;
  money?: number;
}

export const EVENTS: EventDef[] = [
  { id: 'registro', icon: '🚔', kicker: 'Registro policial', severity: 2, tags: ['general'], text: 'ÚLTIMA HORA: La UCO acaba de entrar en la sede de {party} y está clonando los discos duros.', disks: 3 },
  { id: 'telegram', icon: '📱', kicker: 'Filtración', severity: 2, tags: ['backend', 'general'], text: 'Se filtran los mensajes del grupo de Telegram: «Los del Backend del 3 %».' },
  { id: 'rm-rf', icon: '💻', kicker: 'Pruebas destruidas', severity: 4, tags: ['devops', 'general'], text: '{name} ha ejecutado `rm -rf /var/log/corrupcion` delante de los agentes.', disks: 1 },
  { id: 'citacion', icon: '🧑‍⚖️', kicker: 'Citación judicial', severity: 3, tags: ['general', 'devops'], text: 'La Audiencia Nacional cita al responsable del último deploy a producción: {name}.' },
  { id: 'booleano', icon: '💸', kicker: 'Contratos sospechosos', severity: 2, tags: ['general', 'backend', 'frontend'], text: 'Aparece una factura de 600.000 € firmada por {name} por cambiar un booleano de false a true.', money: 600_000 },
  { id: 'dimision-qa', icon: '🔥', kicker: 'Dimisión', severity: 4, tags: ['qa', 'general'], text: 'Dimite el responsable de QA tras descubrirse que llevaba años aprobando los tests sin ejecutarlos.' },
  { id: 'discos', icon: '🗃️', kicker: 'Disco duro', severity: 3, tags: ['general'], text: 'La UCO encuentra 37 discos duros formateados bajo el concepto «refactorización».', disks: 37 },
  { id: 'bolsa', icon: '📉', kicker: 'Crisis bursátil', severity: 3, tags: ['backend', 'general'], text: 'Las acciones de Backend & Maletines caen un 40 % tras descubrirse que su API devuelve datos mockeados.' },
  { id: 'testigo', icon: '🥷', kicker: 'Testigo protegido', severity: 3, tags: ['general'], text: 'Un desarrollador junior entra en el programa de protección de testigos tras aprobar un PR sospechoso de {name}.' },
  { id: 'cors', icon: '📡', kicker: 'Rueda de prensa', severity: 2, tags: ['frontend', 'backend', 'scrum', 'general'], text: 'El portavoz asegura que todo fue culpa de una mala configuración de CORS.' },
  { id: 'mocion', icon: '🗳️', kicker: 'Moción de censura', severity: 4, tags: ['general', 'techlead'], text: 'La oposición presenta una moción de censura contra {name} por hacer push directamente a main.' },
  { id: 'limpieza', icon: '🧨', kicker: 'Destrucción de pruebas', severity: 5, tags: ['general'], text: 'Se descubre que el equipo de {name} había llamado «limpieza técnica» al borrado del historial de Git.', disks: 2 },
  { id: 'jira', icon: '🗂️', kicker: 'Filtración', severity: 1, tags: ['general', 'po', 'scrum'], text: 'Se filtra un ticket de {name} que lleva 23 días en «In Progress» sin un solo commit.' },
  { id: 'friday', icon: '📆', kicker: 'Escándalo', severity: 3, tags: ['devops', 'backend'], text: 'Testigos sitúan a {name} haciendo un deploy un viernes a las 18:47.' },
  { id: 'slack', icon: '💬', kicker: 'Filtración', severity: 3, tags: ['general'], text: 'Aparecen conversaciones de Slack de {name}: «Apruébamelo y te adjudico el microservicio».' },
  { id: 'vpn', icon: '🛰️', kicker: 'Investigación', severity: 3, tags: ['devops', 'architect'], text: 'La UCO rastrea una VPN a nombre de {name} que solo conecta con un servidor en Andorra.' },
  { id: 'excel', icon: '📊', kicker: 'Prueba encontrada', severity: 3, tags: ['data', 'po'], text: 'Se incauta un Excel llamado `contabilidad_REAL_no_borrar.xlsx` en el portátil de {name}.' },
  { id: 'figma', icon: '🎨', kicker: 'Prueba encontrada', severity: 2, tags: ['frontend'], text: 'Un diseño de Figma de {name} contiene un botón oculto llamado «Transferir a Suiza».' },
  { id: 'helicoptero', icon: '🚁', kicker: 'Detención', severity: 5, tags: ['general'], text: 'Un helicóptero de la Guardia Civil sobrevuela la sala de reuniones mientras {name} sigue hablando.' },
  { id: 'extradicion', icon: '✈️', kicker: 'Fuga', severity: 5, tags: ['general'], text: '{name} solicita teletrabajo indefinido desde un país sin tratado de extradición.' },
  { id: 'servidores', icon: '🧯', kicker: 'Registro', severity: 5, tags: ['devops', 'general'], text: 'La UCO se lleva los servidores de producción mientras {name} sigue explicando por qué todavía no ha terminado su ticket.', disks: 12 },
  { id: 'migracion', icon: '☁️', kicker: 'Declaración', severity: 4, tags: ['devops', 'architect'], text: '{name} confirma que las pruebas se perdieron «durante una migración a la nube».' },
  { id: 'cafe', icon: '☕', kicker: 'Escándalo', severity: 1, tags: ['general'], text: 'La Intervención detecta 300.000 € en cápsulas de café cargadas al proyecto de {name}.', money: 300_000 },
  { id: 'licencias', icon: '🪪', kicker: 'Contratos sospechosos', severity: 2, tags: ['general', 'techlead'], text: '{name} compró 4.000 licencias de un IDE para un equipo de seis personas.', money: 1_200_000 },
  { id: 'chatgpt', icon: '🤖', kicker: 'Filtración', severity: 4, tags: ['general'], text: 'Se descubre que los informes de {name} al Congreso los generaba un LLM con temperatura 2.0.' },
  { id: 'hotfix', icon: '🩹', kicker: 'Detención', severity: 4, tags: ['backend', 'devops'], text: 'Detenido un hotfix de madrugada que intentaba cruzar la frontera de producción con 2 millones en el payload.', money: 2_000_000 },
  { id: 'parador-fotos', icon: '📸', kicker: 'Filtración', severity: 3, tags: ['general', 'po', 'scrum'], text: 'Se filtran fotos de {name} en un parador brindando con cava bajo un cartel de «Sprint Planning».' },
  { id: 'cunado-reviewer', icon: '👨‍👩‍👦', kicker: 'Enchufe', severity: 2, tags: ['general', 'techlead'], text: 'El cuñado de {name} aparece como reviewer obligatorio de todos los PR del ministerio.' },
  { id: 'plaza-a-medida', icon: '🪑', kicker: 'Contratación', severity: 3, tags: ['general'], text: 'El BOE publica una plaza de «Principal Engineer» cuyo único requisito es «conocer personalmente a {name}».' },
];
