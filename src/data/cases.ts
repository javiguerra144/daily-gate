import type { Evidence, SceneKind, SceneProp, Tag } from '../types';

/**
 * Catálogo de grandes casos de corrupción tecnológica.
 * Placeholders disponibles: {name}, {cargo}, {Cargo}, {company}, {party}.
 */
export interface CaseDef {
  id: string;
  title: string;
  company: string;
  tags: Tag[];
  amount: number;
  accusation: string;
  headline: string;
  statement?: string;
  evidence?: Evidence;
  /** Noticias de seguimiento que aparecen si el ministro continúa hablando. */
  followups: string[];
  /** Imagen generada del caso. */
  scene: SceneKind;
  props: SceneProp[];
  accent: string;
  screen?: string;
}

export const CASES: CaseDef[] = [
  {
    id: 'caso-500',
    scene: 'hq',
    props: ['briefcase', 'servers', 'money'],
    accent: '#e3122b',
    screen: "HTTP 500 · {status:'ok'}",
    title: 'CASO 500: Internal Server Soborno',
    company: 'Backend & Maletines S.L.',
    tags: ['backend'],
    amount: 14_000_000,
    accusation:
      'La Fiscalía Anticorrupción investiga a {name}, {cargo}, por adjudicar 14 millones de euros a {company} para desarrollar un endpoint que únicamente devuelve `{ "status": "ok" }`.',
    headline: '{name} asegura que los 500 son errores heredados del anterior Gobierno.',
    statement: 'Ese endpoint funcionaba perfectamente en mi máquina.',
    evidence: {
      lang: 'json',
      code: '{\n  "contract": "API de transparencia",\n  "budget": "14.000.000€",\n  "response": "TODO: implement"\n}',
    },
    followups: [
      '{name} asegura desconocer la existencia del endpoint `/api/v1/sobornos`, pese a figurar como autor del último commit.',
      'La UCO confirma que el endpoint devolvía `200 OK` incluso cuando se le preguntaba por los sobres.',
      'Los peritos descubren que el rate limit de {company} solo se aplicaba a la Fiscalía.',
    ],
  },
  {
    id: 'caso-css',
    scene: 'office',
    props: ['monitor', 'envelopes'],
    accent: '#ff4fd8',
    screen: 'display: none;',
    title: 'CASO CSS: Cascada de Sobres Sospechosos',
    company: 'Display None Consulting S.A.',
    tags: ['frontend'],
    amount: 6_500_000,
    accusation:
      'Se han descubierto contratos millonarios adjudicados por {name} a {company} para centrar un div que, después de siete legislaturas, continúa desalineado.',
    headline: 'La oposición denuncia que {name} ocultaba los sobres mediante `display: none`.',
    statement: 'No se ha ocultado nada, simplemente estaba fuera del viewport.',
    evidence: {
      lang: 'css',
      code: '.sobres {\n  display: none !important;\n  position: absolute;\n  left: -9999px; /* por si acaso */\n}',
    },
    followups: [
      'La UCO encuentra 4.000 líneas de `!important` en el despacho de {name}.',
      '{name} alega que el z-index de los sobres era inferior al de la ley.',
      'Peritos judiciales confirman que el div sigue sin centrarse incluso con flexbox.',
    ],
  },
  {
    id: 'commit-fantasma',
    scene: 'office',
    props: ['laptop', 'boxes'],
    accent: '#f05033',
    screen: 'git push --force',
    title: 'OPERACIÓN COMMIT FANTASMA',
    company: 'Git Blame & Asociados S.L.',
    tags: ['general', 'techlead', 'fullstack'],
    amount: 3_200_000,
    accusation:
      'La UCO ha descubierto que {name} realizó 247 commits directamente sobre la rama main sin pasar por ningún proceso de revisión parlamentaria.',
    headline: '{name} niega conocer al autor de los commits pese a que todos aparecen firmados con su usuario.',
    statement: 'Alguien ha usado mi clave SSH. Probablemente el anterior Gobierno.',
    evidence: {
      lang: 'bash',
      code: 'git log --author="{name}"\n\na91b3f0 fix: remove audit logs\nb87c912 feat: add secret bank account\nc71d004 chore: delete evidence',
    },
    followups: [
      'Aparece un `git push --force` firmado por {name} la noche antes del registro.',
      '{company} factura 3 millones por un servicio de «reescritura del historial».',
      'La Fiscalía solicita un `git reflog` completo de {name}.',
    ],
  },
  {
    id: 'offshore-js',
    scene: 'island',
    props: ['briefcase', 'money'],
    accent: '#f7df1e',
    screen: 'await transferir()',
    title: 'CASO OFFSHORE.JS',
    company: 'Async Await Capital Ltd.',
    tags: ['fullstack', 'backend', 'devops'],
    amount: 11_000_000,
    accusation:
      '{name}, {cargo}, habría desviado fondos públicos a una red internacional de empresas offshore mediante promesas que nunca llegan a resolverse.',
    headline: 'La Fiscalía investiga varias transferencias de {name} realizadas con `Promise.all()` a paraísos fiscales.',
    statement: 'El dinero no ha desaparecido. Está pendiente de resolución.',
    evidence: {
      lang: 'js',
      code: "await Promise.all(\n  fondosPublicos.map((euro) =>\n    transferir(euro, 'islas-caiman')\n  )\n); // TODO: .catch()",
    },
    followups: [
      'Se detecta un `UnhandledPromiseRejection` en las cuentas de {company}.',
      '{name} asegura que los fondos volverán «en el siguiente tick del event loop».',
      'Anticorrupción congela un `setTimeout` de 11 millones a nombre de {name}.',
    ],
  },
  {
    id: 'caso-jwt',
    scene: 'hq',
    props: ['envelopes', 'laptop'],
    accent: '#d63aff',
    screen: 'exp: null',
    title: 'CASO JWT: Justicia, Wallets y Transferencias',
    company: 'Bearer Token Investments S.L.',
    tags: ['backend', 'architect'],
    amount: 5_000_000,
    accusation:
      'Se han descubierto contratos públicos firmados por {name} con tokens de autenticación que no caducaban desde 2019.',
    headline: '{name} asegura que los sobres no eran suyos y que alguien utilizó su refresh token.',
    statement: 'Mi token es personal e intransferible. Salvo los martes.',
    evidence: {
      lang: 'json',
      code: '{\n  "sub": "{name}",\n  "role": "superadmin",\n  "exp": null,\n  "comision": "3%"\n}',
    },
    followups: [
      'La UCO decodifica en jwt.io el payload de {name}: contiene un IBAN.',
      '{company} admite que la firma del token era la palabra «secret».',
    ],
  },
  {
    id: 'kubernetes',
    scene: 'datacenter',
    props: ['pods', 'servers'],
    accent: '#326ce5',
    screen: '400 pods Running',
    title: 'OPERACIÓN KUBERNETES',
    company: 'Podemos Escalar S.L.',
    tags: ['devops', 'architect'],
    amount: 32_000_000,
    accusation:
      '{name} adjudicó 32 millones de euros a {company} para desplegar 400 pods destinados a una aplicación que solo utilizan tres funcionarios.',
    headline: 'Anticorrupción investiga por qué cada familiar de {name} dispone de su propio clúster de Kubernetes.',
    statement: 'No son chiringuitos, son microservicios independientes.',
    evidence: {
      lang: 'bash',
      code: 'kubectl get pods -n ministerio\n\ncunado-api        1/1  Running\nsobrino-gateway   1/1  Running\nsuegra-cron       1/1  CrashLoopBackOff',
    },
    followups: [
      '{name} justifica los 400 pods «por si un día viene mucha gente».',
      'La UCO descubre un namespace llamado `caja-b` con autoescalado ilimitado.',
      'Hacienda reclama a {company} la factura de AWS: 2,3 millones al mes.',
    ],
  },
  {
    id: 'null-pointer',
    scene: 'court',
    props: ['briefcase', 'monitor'],
    accent: '#9aa4bf',
    screen: 'NullPointerException',
    title: 'CASO NULL POINTER',
    company: 'Null & Sons Consulting',
    tags: ['backend', 'data', 'general'],
    amount: 18_000_000,
    accusation:
      'La UCO busca al responsable de 18 millones de euros desaparecidos de las cuentas del Ministerio de Transformación Digital, gestionado por {name}.',
    headline: 'El interventor detecta que el dinero público apunta a una dirección de memoria inexistente.',
    statement: 'No podemos identificar al beneficiario porque es null.',
    evidence: {
      lang: 'text',
      code: 'Exception in thread "presupuesto"\njava.lang.NullPointerException:\n  at Ministerio.getBeneficiario(Ministerio.java:3)\n  at {name}.firmarContrato(Despacho.java:1)',
    },
    followups: [
      '{name} propone envolver el presupuesto en un `Optional` para que no se note.',
      'Los auditores encuentran un `catch (Exception e) {}` en la contabilidad de {company}.',
    ],
  },
  {
    id: 'caso-npm',
    scene: 'hq',
    props: ['boxes', 'money'],
    accent: '#cb3837',
    screen: '4700 vulnerabilities',
    title: 'CASO NPM: Negocios Públicos Millonarios',
    company: 'node_modules Patrimonial S.L.',
    tags: ['frontend', 'fullstack'],
    amount: 8_000_000,
    accusation:
      'La Fiscalía investiga a {name} por adjudicar 8 millones a {company} para instalar una dependencia que, a su vez, necesita 4.700 dependencias adicionales.',
    headline: '{name} admite que no sabe qué hacen 3.200 de las empresas subcontratadas.',
    statement: 'Lo instalé porque tenía muchas estrellas en GitHub.',
    evidence: {
      lang: 'bash',
      code: 'npm audit\n\n4700 vulnerabilities\n1200 critical\n3500 political',
    },
    followups: [
      'La UCO tarda 40 minutos en hacer `npm install` antes de poder registrar el portátil de {name}.',
      'Se descubre que `left-pad` cobraba un 3 % de comisión por cada espacio.',
    ],
  },
  {
    id: 'test-verde',
    scene: 'office',
    props: ['monitor', 'envelopes'],
    accent: '#2ecc71',
    screen: '4000 tests passed ✓',
    title: 'OPERACIÓN TEST VERDE',
    company: 'Mocks & Stubs Auditores S.L.',
    tags: ['qa'],
    amount: 4_000_000,
    accusation:
      '{name}, {cargo}, habría pagado 4 millones a {company} por una suite de tests que siempre pasa porque todos sus asserts son `expect(true).toBe(true)`.',
    headline: '{name} defiende una cobertura del 100 % «de las partes que no fallan».',
    statement: 'Los tests estaban en verde. Lo que estaba en rojo era la realidad.',
    evidence: {
      lang: 'js',
      code: "it('no hay corrupción', () => {\n  expect(true).toBe(true);\n});\n\n// 4.000 tests passed ✅",
    },
    followups: [
      'Aparece un `describe.skip` sobre el módulo de contratación pública firmado por {name}.',
      '{company} factura cada test flaky como si fueran dos.',
    ],
  },
  {
    id: 'roadmap',
    scene: 'office',
    props: ['boxes', 'envelopes'],
    accent: '#ffb020',
    screen: 'ROADMAP Q3 (2019-2031)',
    title: 'CASO ROADMAP: Promesas Sin Fecha',
    company: 'Stakeholders Unidos S.L.',
    tags: ['po'],
    amount: 7_000_000,
    accusation:
      '{name} habría adjudicado 7 millones a {company} por un roadmap con 48 funcionalidades prometidas «para el Q3» de cada año desde 2019.',
    headline: '{name} asegura que la feature estrella «ya está en el backlog priorizado».',
    statement: 'Es una promesa electoral, no un compromiso de entrega.',
    evidence: {
      lang: 'text',
      code: 'ROADMAP 2019-2031\n[ ] Login con Google ...... Q3\n[ ] Modo oscuro .......... Q3\n[ ] Transparencia ........ Q3 (próximo)',
    },
    followups: [
      '{name} reprioriza la investigación judicial a «nice to have».',
      'Se filtra que {company} cobraba por cada post-it movido en el tablero.',
    ],
  },
  {
    id: 'story-points',
    scene: 'court',
    props: ['envelopes', 'money'],
    accent: '#00c2a8',
    screen: 'Velocity: 89 pts',
    title: 'CASO STORY POINTS',
    company: 'Fibonacci Holdings S.A.',
    tags: ['scrum'],
    amount: 13_000_000,
    accusation:
      'La UCO investiga a {name} por inflar artificialmente los story points para justificar 13 millones de euros en horas extraordinarias de {company}.',
    headline: '{name} sostiene que un cambio de color de botón vale 21 puntos «por la incertidumbre».',
    statement: 'La velocidad del equipo es un concepto, no una cifra auditable.',
    evidence: {
      lang: 'text',
      code: 'Sprint 24 — Velocity\nPlanificado: 34 pts\nEntregado:    3 pts\nFacturado:   89 pts',
    },
    followups: [
      '{name} convoca una retrospectiva de emergencia para hablar «de lo que ha ido bien».',
      'Se descubre que la burndown chart de {company} solo sube.',
    ],
  },
  {
    id: 'data-swamp',
    scene: 'datacenter',
    props: ['servers', 'monitor'],
    accent: '#29b6f6',
    screen: 'SELECT * FROM sobres',
    title: 'OPERACIÓN DATA SWAMP',
    company: 'Lago Opaco Analytics S.L.',
    tags: ['data'],
    amount: 21_000_000,
    accusation:
      '{name} adjudicó 21 millones a {company} para construir un data lake cuya única tabla se llama `sobres_final_v2_DEFINITIVO`.',
    headline: 'La UCO necesita 9 horas para que termine el `SELECT *` sobre las cuentas de {name}.',
    statement: 'Los datos están ahí. Otra cosa es que alguien sepa consultarlos.',
    evidence: {
      lang: 'sql',
      code: 'SELECT beneficiario, SUM(importe)\nFROM sobres_final_v2_DEFINITIVO\nWHERE ministro = \'{name}\'\n-- 0 rows (ETL fallida desde 2021)',
    },
    followups: [
      '{name} atribuye las discrepancias a «un problema de calidad del dato».',
      'El pipeline de {company} borraba las filas que contenían la palabra «comisión».',
    ],
  },
  {
    id: 'hexagonal',
    scene: 'hq',
    props: ['boxes', 'briefcase'],
    accent: '#b06bff',
    screen: 'AbstractFactoryImpl',
    title: 'CASO HEXAGONAL',
    company: 'Capas & Capas Arquitectos S.L.P.',
    tags: ['architect', 'techlead'],
    amount: 12_000_000,
    accusation:
      '{name}, {cargo}, encargó a {company} una arquitectura de 9 capas, 14 patrones y 3 buses de eventos para un CRUD de dos tablas.',
    headline: 'Nadie consigue seguir el rastro del dinero a través de las capas de abstracción diseñadas por {name}.',
    statement: 'El dinero está desacoplado del dominio, como dicta la buena arquitectura.',
    evidence: {
      lang: 'text',
      code: 'SobreFactoryProviderAdapterImpl\n  -> AbstractComisionStrategyPort\n    -> DinamicoMaletinRepositoryDecorator\n      -> ??? ',
    },
    followups: [
      '{name} presenta un diagrama C4 de 140 páginas como prueba de su inocencia.',
      'La Fiscalía no puede imputar a nadie porque todo depende de una interfaz.',
    ],
  },
  {
    id: 'parador',
    scene: 'hq',
    props: ['champagne', 'money', 'envelopes'],
    accent: '#c2185b',
    screen: 'Servicio de acompañamiento x12',
    title: 'CASO PARADOR: Hospitality as a Service',
    company: 'Parador Nacional del Monolito',
    tags: ['general', 'po', 'techlead', 'scrum'],
    amount: 470_000,
    accusation:
      '{name}, {cargo}, habría cargado al presupuesto del sprint 470.000 € en «servicios de acompañamiento» durante un offsite de team building en el {company}.',
    headline: 'La factura del parador incluye 12 «consultoras externas de acompañamiento» que no aparecen en ningún repositorio.',
    statement: 'Eran expertas en pair programming. Muy colaborativas.',
    evidence: {
      lang: 'text',
      code: 'FACTURA Nº 2024/0347 · Parador Nacional del Monolito\nSala de reuniones (sin usar) ........    450 €\nServicio de acompañamiento x12 ...... 360.000 €\n"Workshop de escalabilidad" ......... 109.550 €\nTOTAL (cargado al sprint) ........... 470.000 €',
    },
    followups: [
      'La UCO descubre que la «retro de equipo» del parador duró tres noches y no generó ni un solo action item.',
      '{name} justifica el gasto como «onboarding de talento externo».',
      'El parador confirma que el equipo solo pidió la contraseña del wifi para «subir un hotfix» a las 4 de la madrugada.',
    ],
  },
  {
    id: 'enchufe-premium',
    scene: 'office',
    props: ['monitor', 'champagne', 'envelopes'],
    accent: '#ff6f91',
    screen: 'entrevista_tecnica: false',
    title: 'OPERACIÓN ENCHUFE PREMIUM',
    company: 'Recursos Humanos & Afines S.L.',
    tags: ['general', 'po', 'scrum', 'techlead'],
    amount: 1_400_000,
    accusation:
      '{name} habría colocado a tres «acompañantes de confianza» como Principal Engineers de la Empresa Pública de Transformación Digital, sin entrevista técnica ni prueba de FizzBuzz.',
    headline: 'Las nuevas Principal Engineers enchufadas por {name} cobran 140.000 € y su único commit es «Initial commit».',
    statement: 'Fueron seleccionadas por sus soft skills.',
    evidence: {
      lang: 'json',
      code: 'POST /api/rrhh/contrataciones\n{\n  "puesto": "Principal Engineer",\n  "entrevista_tecnica": false,\n  "referida_por": "{name}",\n  "experiencia": "acompañamiento ejecutivo"\n}',
    },
    followups: [
      'La UCO comprueba que el proceso de selección consistió en «una cena en el parador».',
      'Los currículos de las nuevas directivas incluyen «gestión de stakeholders nocturnos».',
      '{name} sostiene que las contrataciones cumplen la política de «inyección de dependencias externas».',
    ],
  },
  {
    id: 'nepotism-js',
    scene: 'office',
    props: ['laptop', 'boxes', 'briefcase'],
    accent: '#8bc34a',
    screen: 'class Cunado extends Familia',
    title: 'CASO NEPOTISM.JS: Enchufe de familiares',
    company: 'Primos & Cuñados Consulting S.L.',
    tags: ['general', 'techlead', 'architect', 'fullstack', 'backend'],
    amount: 2_300_000,
    accusation:
      '{name}, {cargo}, ha contratado a su cuñado, dos primos y un sobrino como «arquitectos cloud» del ministerio a través de {company}. Ninguno sabe qué es un pod.',
    headline: 'El organigrama del ministerio de {name} resulta ser un árbol genealógico.',
    statement: 'Es una estructura de herencia, como en la programación orientada a objetos.',
    evidence: {
      lang: 'js',
      code: "class Cunado extends Familia {\n  constructor() {\n    super();\n    this.sueldo = 95_000;\n  }\n  trabajar() {\n    throw new Error('Not implemented');\n  }\n}",
    },
    followups: [
      'Se descubre que el sobrino de {name} tiene permisos de admin en producción «por si acaso».',
      'La UCO encuentra la dependencia `primo-de-{name}` en el package.json del ministerio.',
      'El cuñado de {name} pide la palabra en la daily para opinar de Kubernetes.',
    ],
  },
];

export function caseById(id: string): CaseDef | undefined {
  return CASES.find((c) => c.id === id);
}
