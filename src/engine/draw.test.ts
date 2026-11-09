import { describe, expect, it } from 'vitest';
import { CARGO_POOL } from '../data/roles';
import { defaultConfig, newParticipant } from '../storage';
import { drawGovernment } from './draw';

describe('drawGovernment', () => {
  it('reparte cargos distintos a todos y conserva a los participantes', () => {
    const config = { ...defaultConfig(), participants: ['Ana', 'Bea', 'Carlos', 'Dani', 'Eva', '  '].map((n) => newParticipant(n)) };
    const drawn = drawGovernment(config);
    expect(drawn.participants.map((p) => p.name).sort()).toEqual(['Ana', 'Bea', 'Carlos', 'Dani', 'Eva']);
    const cargos = drawn.participants.map((p) => p.cargo);
    expect(new Set(cargos).size).toBe(cargos.length);
    for (const p of drawn.participants) {
      expect(CARGO_POOL.find((c) => c.cargo === p.cargo)?.specialty).toBe(p.specialty);
    }
  });

  it('baraja el orden de intervención', () => {
    const config = { ...defaultConfig(), participants: Array.from({ length: 10 }, (_, i) => newParticipant(`P${i}`)) };
    const orders = new Set(Array.from({ length: 20 }, () => drawGovernment(config).participants.map((p) => p.name).join(',')));
    expect(orders.size).toBeGreaterThan(1);
  });
});
