package com.example.demo.service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.game.CreatureOnBoard;
import com.example.demo.game.GameState;

@Service
public class CombatService {

	private final AbilityService abilityService;

	public CombatService(AbilityService abilityService) {
		this.abilityService = abilityService;
	}

	public List<String> buildAttackQueue(List<CreatureOnBoard> board) {
		return board.stream()
			.filter(CreatureOnBoard::isAlive)
			.filter(CreatureOnBoard::isCanAttack)
			.sorted(Comparator
				.<CreatureOnBoard>comparingInt(creature -> abilityService.getEffectiveInitiative(creature, board))
				.reversed()
				.thenComparingInt(CreatureOnBoard::getBoardIndex))
			.map(CreatureOnBoard::getInstanceId)
			.collect(Collectors.toList());
	}

	public void applyCreatureCombat(
		CreatureOnBoard attacker,
		CreatureOnBoard defender,
		List<CreatureOnBoard> attackerBoard,
		List<CreatureOnBoard> defenderBoard
	) {
		abilityService.applyCreatureCombat(attacker, defender, attackerBoard, defenderBoard);
	}

	public void applyFaceAttack(
		CreatureOnBoard attacker,
		GameState state,
		boolean playerAttacking,
		List<CreatureOnBoard> attackerBoard
	) {
		int damage = abilityService.computeFaceDamage(attacker, attackerBoard);
		if (playerAttacking) {
			state.setOpponentHealth(state.getOpponentHealth() - damage);
		}
		else {
			state.setPlayerHealth(state.getPlayerHealth() - damage);
		}
		attacker.setCanAttack(false);
	}

	public void removeDeadCreatures(List<CreatureOnBoard> board) {
		board.removeIf(creature -> !creature.isAlive());
	}

	public CreatureOnBoard findCreature(List<CreatureOnBoard> board, String instanceId) {
		return board.stream()
			.filter(creature -> creature.getInstanceId().equals(instanceId))
			.findFirst()
			.orElse(null);
	}
}
