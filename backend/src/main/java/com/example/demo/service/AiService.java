package com.example.demo.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.entity.CardDefinition;
import com.example.demo.game.AbilityKey;
import com.example.demo.game.CardInZone;
import com.example.demo.game.CreatureOnBoard;
import com.example.demo.game.GamePhase;
import com.example.demo.game.GameState;
import com.example.demo.game.TurnOwner;
import com.example.demo.repository.CardDefinitionRepository;

@Service
public class AiService {

	private final CardDefinitionRepository cardDefinitionRepository;
	private final CombatService combatService;
	private final AbilityService abilityService;

	public AiService(
		CardDefinitionRepository cardDefinitionRepository,
		CombatService combatService,
		AbilityService abilityService
	) {
		this.cardDefinitionRepository = cardDefinitionRepository;
		this.combatService = combatService;
		this.abilityService = abilityService;
	}

	public void runOpponentTurn(GameState state) {
		if (state.isGameOver()) {
			return;
		}
		prepareOpponentTurnStart(state);
		state.setTurnOwner(TurnOwner.OPPONENT);
		state.setPhase(GamePhase.PLAY);
		state.setLastMessage("Ход противника: фаза разыгрывания.");

		runOpponentPlayPhase(state);
		if (state.isGameOver()) {
			return;
		}

		state.setPhase(GamePhase.ATTACK);
		state.setAttackQueue(combatService.buildAttackQueue(state.getOpponentBoard()));
		state.setAttackQueueIndex(0);
		runOpponentAttackPhase(state);
	}

	private void prepareOpponentTurnStart(GameState state) {
		if (state.getTurnNumber() > 1) {
			state.setOpponentMaxMana(Math.min(GameState.MAX_MANA, state.getOpponentMaxMana() + 1));
			state.setOpponentMana(state.getOpponentMaxMana());
			if (!state.getOpponentDeck().isEmpty()) {
				CardInZone drawn = state.getOpponentDeck().remove(0);
				state.getOpponentHand().add(drawn);
			}
		}
		for (CreatureOnBoard creature : state.getOpponentBoard()) {
			if (creature.isAlive()) {
				creature.setCanAttack(true);
			}
		}
	}

	private void runOpponentPlayPhase(GameState state) {
		boolean played = true;
		while (played && !state.isGameOver()) {
			played = false;
			List<CardInZone> hand = new ArrayList<>(state.getOpponentHand());
			Collections.shuffle(hand);
			for (CardInZone card : hand) {
				CardDefinition definition = cardDefinitionRepository.findById(card.getCardDefinitionId()).orElse(null);
				if (definition == null) {
					continue;
				}
				if (definition.getManaCost() > state.getOpponentMana()) {
					continue;
				}
				playOpponentCard(state, card, definition);
				played = true;
				break;
			}
		}
	}

	private void playOpponentCard(GameState state, CardInZone card, CardDefinition definition) {
		state.getOpponentHand().removeIf(handCard -> handCard.getInstanceId().equals(card.getInstanceId()));
		state.setOpponentMana(state.getOpponentMana() - definition.getManaCost());

		CreatureOnBoard creature = new CreatureOnBoard();
		creature.setInstanceId(card.getInstanceId());
		creature.setCardDefinitionId(definition.getId());
		creature.setCurrentHealth(definition.getHealth());
		creature.setAttack(definition.getAttack());
		creature.setDefense(definition.getDefense());
		creature.setInitiative(definition.getInitiative());
		creature.setBoardIndex(nextBoardIndex(state.getOpponentBoard()));
		creature.setCanAttack(false);
		state.getOpponentBoard().add(creature);

		if (abilityService.hasAbility(definition, AbilityKey.ANCIENT_KNOWLEDGE)) {
			List<CardInZone> scryCards = abilityService.beginAncientKnowledge(state.getOpponentDeck());
			abilityService.resolveAncientKnowledgeAuto(scryCards, state.getOpponentDeck(), state.getOpponentHand());
		}
	}

	private void runOpponentAttackPhase(GameState state) {
		while (!state.isGameOver() && state.getAttackQueueIndex() < state.getAttackQueue().size()) {
			String attackerId = state.getAttackQueue().get(state.getAttackQueueIndex());
			CreatureOnBoard attacker = combatService.findCreature(state.getOpponentBoard(), attackerId);
			if (attacker == null || !attacker.isAlive() || !attacker.isCanAttack()) {
				state.setAttackQueueIndex(state.getAttackQueueIndex() + 1);
				continue;
			}

			if (abilityService.canAttackFace(attacker, state.getPlayerBoard())) {
				combatService.applyFaceAttack(attacker, state, false, state.getOpponentBoard());
				checkGameOver(state);
			}
			else if (!state.getPlayerBoard().isEmpty()) {
				CreatureOnBoard target = pickAttackTarget(attacker, state.getPlayerBoard());
				if (target == null) {
					attacker.setCanAttack(false);
					state.setAttackQueueIndex(state.getAttackQueueIndex() + 1);
					continue;
				}
				combatService.applyCreatureCombat(
					attacker,
					target,
					state.getOpponentBoard(),
					state.getPlayerBoard()
				);
				combatService.removeDeadCreatures(state.getPlayerBoard());
				combatService.removeDeadCreatures(state.getOpponentBoard());
				checkGameOver(state);
			}
			else {
				attacker.setCanAttack(false);
			}
			state.setAttackQueueIndex(state.getAttackQueueIndex() + 1);
		}
		state.setAttackQueue(Collections.emptyList());
		state.setAttackQueueIndex(0);
	}

	private CreatureOnBoard pickAttackTarget(CreatureOnBoard attacker, List<CreatureOnBoard> defenderBoard) {
		List<CreatureOnBoard> legal = defenderBoard.stream()
			.filter(CreatureOnBoard::isAlive)
			.filter(defender -> abilityService.canAttackCreature(attacker, defender))
			.collect(Collectors.toList());
		if (legal.isEmpty()) {
			return null;
		}
		List<CreatureOnBoard> taunts = legal.stream()
			.filter(defender -> abilityService.hasAbility(
				cardDefinitionRepository.findById(defender.getCardDefinitionId()).orElseThrow(),
				AbilityKey.TAUNT
			))
			.toList();
		List<CreatureOnBoard> pool = taunts.isEmpty() ? legal : taunts;
		return pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
	}

	private int nextBoardIndex(List<CreatureOnBoard> board) {
		return board.stream().mapToInt(CreatureOnBoard::getBoardIndex).max().orElse(-1) + 1;
	}

	private void checkGameOver(GameState state) {
		if (state.getPlayerHealth() <= 0) {
			state.setGameOver(true);
			state.setWinner("OPPONENT");
			state.setLastMessage("Поражение. Противник победил.");
		}
	}
}
