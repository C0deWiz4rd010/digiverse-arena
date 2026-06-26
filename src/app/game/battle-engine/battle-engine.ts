import type { Digimon } from '../../core/models/digimon';
import { mulberry32 } from '../../core/utils/seed';
import {
  attributeMultiplier,
  deriveSkills,
  deriveStats,
  fieldAffinityBonus,
  primaryAttribute,
  type BattleStats,
  type DerivedSkill,
} from '../stats/battle-stats';

export interface BattleCombatant {
  uid: string;
  team: 'player' | 'enemy';
  digimon: Digimon;
  stats: BattleStats;
  skills: DerivedSkill[];
  hp: number;
  maxHp: number;
  focus: number;
  guard: boolean;
  cooldowns: Record<string, number>;
  ko: boolean;
}

export interface BattleOptions {
  mode: string;
  arenaField?: string | null;
  seed?: number;
  maxTurns?: number;
}

export type BattleWinner = 'player' | 'enemy' | 'draw';

export type BattleEvent =
  | { type: 'battle-start'; mode: string; arenaField: string | null }
  | { type: 'turn-start'; turn: number; actorId: string; actorName: string }
  | { type: 'skill-used'; actorId: string; targetId: string; skillId: string; skillName: string }
  | { type: 'damage'; targetId: string; amount: number; critical: boolean; remainingHp: number }
  | { type: 'buff'; targetId: string; stat: 'focus' | 'guard'; amount: number }
  | { type: 'ko'; targetId: string; targetName: string }
  | { type: 'battle-end'; winner: BattleWinner; turns: number };

export interface BattleResult {
  winner: BattleWinner;
  turns: number;
  player: BattleCombatant[];
  enemy: BattleCombatant[];
  events: BattleEvent[];
}

export function createCombatants(team: 'player' | 'enemy', digimon: Digimon[]): BattleCombatant[] {
  return digimon.map((member, index) => {
    const stats = deriveStats(member);
    return {
      uid: `${team}-${member.id}-${index}`,
      team,
      digimon: member,
      stats,
      skills: deriveSkills(member),
      hp: stats.hp,
      maxHp: stats.hp,
      focus: 0,
      guard: false,
      cooldowns: {},
      ko: false,
    };
  });
}

export function simulateBattle(playerTeam: Digimon[], enemyTeam: Digimon[], options: BattleOptions): BattleResult {
  const seed =
    options.seed ??
    [...playerTeam, ...enemyTeam].reduce((sum, digimon, index) => sum + digimon.id * (index + 3), 17);
  const rng = mulberry32(seed);
  const player = createCombatants('player', playerTeam);
  const enemy = createCombatants('enemy', enemyTeam);
  const events: BattleEvent[] = [{ type: 'battle-start', mode: options.mode, arenaField: options.arenaField ?? null }];
  const maxTurns = options.maxTurns ?? 72;

  let turn = 0;
  while (turn < maxTurns && alive(player).length && alive(enemy).length) {
    turn += 1;
    const actors = [...alive(player), ...alive(enemy)].sort(
      (a, b) => b.stats.speed + b.focus - (a.stats.speed + a.focus),
    );

    for (const actor of actors) {
      if (actor.ko) continue;
      const targets = actor.team === 'player' ? alive(enemy) : alive(player);
      if (!targets.length) break;
      tickCooldowns(actor);
      actor.guard = false;
      const target = chooseTarget(targets);
      const skill = chooseSkill(actor, target, rng);

      events.push({ type: 'turn-start', turn, actorId: actor.uid, actorName: actor.digimon.name });
      events.push({
        type: 'skill-used',
        actorId: actor.uid,
        targetId: target.uid,
        skillId: skill.id,
        skillName: skill.name,
      });

      if (skill.kind === 'support' && actor.hp < actor.maxHp * 0.55) {
        const heal = Math.round(actor.maxHp * 0.16 + actor.stats.spirit * 0.12);
        actor.hp = Math.min(actor.maxHp, actor.hp + heal);
        actor.focus += 5;
        actor.cooldowns[skill.id] = skill.cooldown;
        events.push({ type: 'buff', targetId: actor.uid, stat: 'focus', amount: heal });
        continue;
      }

      const hitRoll = rng() * 100;
      const focusBonus = actor.focus * 0.3;
      if (hitRoll > skill.accuracy + focusBonus) {
        actor.focus += 4;
        events.push({ type: 'damage', targetId: target.uid, amount: 0, critical: false, remainingHp: target.hp });
        continue;
      }

      const attribute = attributeMultiplier(primaryAttribute(actor.digimon), primaryAttribute(target.digimon));
      const field = fieldAffinityBonus(actor.digimon, options.arenaField ?? null);
      const crit = rng() < Math.min(0.28, 0.06 + actor.stats.technique / 900 + actor.focus / 300);
      const guard = target.guard ? 0.68 : 1;
      const variance = 0.88 + rng() * 0.22;
      const raw =
        (actor.stats.attack * 0.42 + actor.stats.technique * 0.24 + skill.power) *
        attribute *
        field *
        guard *
        variance *
        (crit ? 1.48 : 1);
      const mitigation = target.stats.defense * 0.27 + target.stats.spirit * 0.08;
      const amount = Math.max(1, Math.round(raw - mitigation));
      target.hp = Math.max(0, target.hp - amount);
      actor.focus = Math.max(0, actor.focus - 4 + (crit ? 8 : 2));
      actor.cooldowns[skill.id] = skill.cooldown;

      events.push({ type: 'damage', targetId: target.uid, amount, critical: crit, remainingHp: target.hp });
      if (target.hp <= 0 && !target.ko) {
        target.ko = true;
        events.push({ type: 'ko', targetId: target.uid, targetName: target.digimon.name });
      }
    }
  }

  const winner = alive(player).length && !alive(enemy).length ? 'player' : alive(enemy).length && !alive(player).length ? 'enemy' : 'draw';
  events.push({ type: 'battle-end', winner, turns: turn });
  return { winner, turns: turn, player, enemy, events };
}

export function battleSummary(result: BattleResult): string {
  const playerNames = result.player.map((c) => c.digimon.name).join(', ');
  const enemyNames = result.enemy.map((c) => c.digimon.name).join(', ');
  const winner = result.winner === 'player' ? playerNames : result.winner === 'enemy' ? enemyNames : 'No side';
  return `${winner} won after ${result.turns} turns.`;
}

function alive(team: BattleCombatant[]): BattleCombatant[] {
  return team.filter((combatant) => !combatant.ko && combatant.hp > 0);
}

function tickCooldowns(actor: BattleCombatant): void {
  for (const key of Object.keys(actor.cooldowns)) {
    actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - 1);
  }
}

function chooseTarget(targets: BattleCombatant[]): BattleCombatant {
  return [...targets].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

function chooseSkill(actor: BattleCombatant, target: BattleCombatant, rng: () => number): DerivedSkill {
  const ready = actor.skills.filter((skill) => !actor.cooldowns[skill.id]);
  const usable = ready.length ? ready : actor.skills;
  const targetLow = target.hp / target.maxHp < 0.34;
  const finisher = usable.find((skill) => skill.kind === 'finisher');
  if (targetLow && finisher) return finisher;
  if (actor.hp / actor.maxHp < 0.45) {
    const support = usable.find((skill) => skill.kind === 'support');
    if (support) return support;
  }
  return [...usable].sort((a, b) => b.power - a.power + (rng() > 0.82 ? -8 : 0))[0];
}
