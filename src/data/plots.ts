import type { Severity, Tag } from '../types';

/**
 * Tramas: historias que evolucionan paso a paso y pueden continuar
 * durante las intervenciones de los siguientes compañeros.
 * Placeholders: {name} (quien habla ahora), {prev} (implicado anterior o quien habla).
 */
export interface PlotStep {
  icon: string;
  severity: Severity;
  text: string;
}

export interface PlotDef {
  id: string;
  title: string;
  tags: Tag[];
  money: number;
  steps: PlotStep[];
}

export const PLOTS: PlotDef[] = [
  {
    id: 'boton',
    title: 'El caso del botón millonario',
    tags: ['frontend', 'general'],
    money: 2_000_000,
    steps: [
      { icon: '📰', severity: 2, text: 'Un medio publica que el Gobierno adjudicó 2 millones de euros para desarrollar un botón.' },
      { icon: '🚨', severity: 3, text: 'La UCO registra las oficinas de Button Solutions Enterprise S.L.' },
      { icon: '🔴', severity: 4, text: 'El botón no funciona en Safari. La Fiscalía amplía la investigación.' },
      { icon: '💀', severity: 5, text: 'El empresario adjudicatario resulta ser el primo de {name}.' },
      { icon: '🏛️', severity: 3, text: 'El Gobierno comparece y afirma que el botón está en fase beta.' },
    ],
  },
  {
    id: 'redis',
    title: 'Los sobres en Redis',
    tags: ['backend', 'data', 'general'],
    money: 7_000_000,
    steps: [
      { icon: '📰', severity: 2, text: 'Un exempleado denuncia la existencia de una caché B con información sobre pagos irregulares.' },
      { icon: '🚔', severity: 3, text: 'La UCO encuentra 700 sobres almacenados en Redis.' },
      { icon: '🔥', severity: 4, text: 'Las transferencias se realizaban mediante una cola de mensajes Kafka.' },
      { icon: '💥', severity: 4, text: 'El Gobierno asegura que no puede recuperar los fondos porque las claves han expirado.' },
      { icon: '💀', severity: 5, text: 'Dimite {name} después de intentar ejecutar `FLUSHALL` en presencia de la Guardia Civil.' },
    ],
  },
  {
    id: 'pull-request',
    title: 'La conspiración del Pull Request',
    tags: ['general', 'techlead', 'qa'],
    money: 1_500_000,
    steps: [
      { icon: '📰', severity: 2, text: 'La oposición exige explicaciones sobre un PR aprobado en 14 segundos.' },
      { icon: '🚨', severity: 3, text: 'Se descubre que los tres reviewers eran cuentas de {prev}.' },
      { icon: '🔥', severity: 4, text: 'Aparecen conversaciones en Slack: «Apruébamelo y te adjudico el microservicio».' },
      { icon: '💀', severity: 5, text: 'La UCO descubre que el único cambio del PR era añadir una cuenta bancaria a nombre de {name}.' },
    ],
  },
  {
    id: 'viernes',
    title: 'El deploy del viernes',
    tags: ['devops', 'backend', 'general'],
    money: 4_500_000,
    steps: [
      { icon: '📰', severity: 2, text: 'Vecinos denuncian ruido de pipelines en la sede del Gobierno un viernes por la tarde.' },
      { icon: '🚨', severity: 3, text: 'Se confirma un deploy a producción sin tests firmado por {prev}.' },
      { icon: '🔴', severity: 4, text: 'Producción cae durante 72 horas. {name} declara que «en staging funcionaba».' },
      { icon: '💀', severity: 5, text: 'El rollback revela 4,5 millones transferidos durante la caída del sistema.' },
      { icon: '🏛️', severity: 3, text: 'El Gobierno aprueba por decreto que los viernes no existen.' },
    ],
  },
];
