package com.example.demo.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.demo.dto.CardAbilityDto;
import com.example.demo.entity.CardDefinition;
import com.example.demo.game.AbilityKey;
import com.example.demo.game.CardInZone;
import com.example.demo.game.CreatureOnBoard;
import com.example.demo.repository.CardDefinitionRepository;

@Service
public class AbilityService {

	private static final String TREEMAN_TYPE = "Древолюд";
	private static final String ROCK_SOLIDITY = "Твердость Скалы";

	private final CardDefinitionRepository cardDefinitionRepository;
	private final CardCatalogService cardCatalogService;

	public AbilityService(
		CardDefinitionRepository cardDefinitionRepository,
		CardCatalogService cardCatalogService
	) {
		this.cardDefinitionRepository = cardDefinitionRepository;
		this.cardCatalogService = cardCatalogService;
	}

	public List<CardAbilityDto> getAbilities(Long cardDefinitionId) {
		return cardCatalogService.getAbilitiesForCard(cardDefinitionId);
	}

	public boolean hasAbility(CardDefinition card, AbilityKey abilityKey) {
		return getAbilities(card.getId()).stream()
			.anyMatch(ability -> abilityKey.name().equals(ability.getKey()));
	}

	public boolean hasRockSolidity(CardDefinition card) {
		if (card == null) {
			return false;
		}
		return card.getCreatureTypes() != null && card.getCreatureTypes().contains(ROCK_SOLIDITY);
	}

	public int getEffectiveAttack(CreatureOnBoard creature, List<CreatureOnBoard> friendlyBoard) {
		CardDefinition card = requireCard(creature.getCardDefinitionId());
		int attack = creature.getAttack();
		if (hasAbility(card, AbilityKey.FOREST_UNITY_ATK)) {
			CardAbilityDto ability = findAbility(card, AbilityKey.FOREST_UNITY_ATK);
			if (hasOtherTreantWithAttackAbove(friendlyBoard, creature, ability.param("minAllyAttack", 4))) {
				attack += ability.param("bonusAttack", 2);
			}
		}
		if (hasAbility(card, AbilityKey.FOREST_UNITY_ATK_DEF)) {
			CardAbilityDto ability = findAbility(card, AbilityKey.FOREST_UNITY_ATK_DEF);
			if (hasOtherTreantWithAttackAbove(friendlyBoard, creature, ability.param("minAllyAttack", 5))) {
				attack += ability.param("bonusAttack", 2);
			}
		}
		return attack;
	}

	public int getEffectiveDefense(CreatureOnBoard creature, List<CreatureOnBoard> friendlyBoard) {
		CardDefinition card = requireCard(creature.getCardDefinitionId());
		int defense = creature.getDefense();
		if (hasAbility(card, AbilityKey.FOREST_UNITY_DEF)) {
			CardAbilityDto ability = findAbility(card, AbilityKey.FOREST_UNITY_DEF);
			int minAllyAttack = ability.param("minAllyAttack", 3);
			int bonusDefense = ability.param("bonusDefense", 1);
			if (hasOtherTreantWithAttackAbove(friendlyBoard, creature, minAllyAttack)) {
				defense += bonusDefense;
			}
		}
		if (hasAbility(card, AbilityKey.FOREST_UNITY_ATK_DEF)) {
			CardAbilityDto ability = findAbility(card, AbilityKey.FOREST_UNITY_ATK_DEF);
			int minAllyAttack = ability.param("minAllyAttack", 5);
			int bonusDefense = ability.param("bonusDefense", 2);
			if (hasOtherTreantWithAttackAbove(friendlyBoard, creature, minAllyAttack)) {
				defense += bonusDefense;
			}
		}
		return defense;
	}

	public int computeDamageToDefender(
		CreatureOnBoard attacker,
		CreatureOnBoard defender,
		List<CreatureOnBoard> attackerBoard,
		List<CreatureOnBoard> defenderBoard
	) {
		CardDefinition attackerCard = requireCard(attacker.getCardDefinitionId());
		CardDefinition defenderCard = requireCard(defender.getCardDefinitionId());
		int attackPower = getEffectiveAttack(attacker, attackerBoard);
		int defensePower = getEffectiveDefense(defender, defenderBoard);

		if (hasAbility(attackerCard, AbilityKey.PIERCING) && !hasRockSolidity(defenderCard)) {
			return Math.max(1, attackPower);
		}
		return Math.max(1, attackPower - defensePower);
	}

	public int computeCounterDamage(
		CreatureOnBoard attacker,
		CreatureOnBoard defender,
		List<CreatureOnBoard> attackerBoard,
		List<CreatureOnBoard> defenderBoard
	) {
		CardDefinition attackerCard = requireCard(attacker.getCardDefinitionId());
		CardDefinition defenderCard = requireCard(defender.getCardDefinitionId());

		if (hasAbility(attackerCard, AbilityKey.RANGED)) {
			return 0;
		}
		if (hasAbility(attackerCard, AbilityKey.INTIMIDATION)
			&& !hasRockSolidity(defenderCard)
			&& getEffectiveAttack(defender, defenderBoard) < getEffectiveAttack(attacker, attackerBoard)) {
			return 0;
		}

		int counterAttack = defender.getAttack();
		int attackerDefense = getEffectiveDefense(attacker, attackerBoard);
		return Math.max(1, counterAttack - attackerDefense);
	}

	public void applyCreatureCombat(
		CreatureOnBoard attacker,
		CreatureOnBoard defender,
		List<CreatureOnBoard> attackerBoard,
		List<CreatureOnBoard> defenderBoard
	) {
		int toDefender = computeDamageToDefender(attacker, defender, attackerBoard, defenderBoard);
		int toAttacker = computeCounterDamage(attacker, defender, attackerBoard, defenderBoard);
		defender.setCurrentHealth(defender.getCurrentHealth() - toDefender);
		attacker.setCurrentHealth(attacker.getCurrentHealth() - toAttacker);
		attacker.setCanAttack(false);
	}

	public int computeFaceDamage(CreatureOnBoard attacker, List<CreatureOnBoard> attackerBoard) {
		return Math.max(1, getEffectiveAttack(attacker, attackerBoard));
	}

	public int getEffectiveInitiative(CreatureOnBoard creature, List<CreatureOnBoard> friendlyBoard) {
		CardDefinition card = requireCard(creature.getCardDefinitionId());
		int initiative = creature.getInitiative();
		boolean tailwindOnField = friendlyBoard.stream()
			.filter(CreatureOnBoard::isAlive)
			.filter(ally -> !ally.getInstanceId().equals(creature.getInstanceId()))
			.anyMatch(ally -> hasAbility(requireCard(ally.getCardDefinitionId()), AbilityKey.TAILWIND));
		if (tailwindOnField && hasAbility(card, AbilityKey.FLIGHT)) {
			initiative += 1;
		}
		return initiative;
	}

	public boolean canAttackCreature(CreatureOnBoard attacker, CreatureOnBoard defender) {
		CardDefinition attackerCard = requireCard(attacker.getCardDefinitionId());
		CardDefinition defenderCard = requireCard(defender.getCardDefinitionId());
		if (!hasAbility(defenderCard, AbilityKey.FLIGHT)) {
			return true;
		}
		return hasAbility(attackerCard, AbilityKey.FLIGHT) || hasAbility(attackerCard, AbilityKey.INTERCEPT);
	}

	public boolean canAttackAsTarget(
		CreatureOnBoard attacker,
		CreatureOnBoard defender,
		List<CreatureOnBoard> defenderBoard
	) {
		if (!defender.isAlive()) {
			return false;
		}
		if (!canAttackCreature(attacker, defender)) {
			return false;
		}
		return mustAttackTaunt(defenderBoard, defender);
	}

	public boolean mustAttackTaunt(List<CreatureOnBoard> defenderBoard, CreatureOnBoard chosenDefender) {
		List<CreatureOnBoard> taunts = defenderBoard.stream()
			.filter(CreatureOnBoard::isAlive)
			.filter(creature -> hasAbility(requireCard(creature.getCardDefinitionId()), AbilityKey.TAUNT))
			.toList();
		if (taunts.isEmpty()) {
			return true;
		}
		return taunts.stream().anyMatch(taunt -> taunt.getInstanceId().equals(chosenDefender.getInstanceId()));
	}

	public List<CardInZone> beginAncientKnowledge(List<CardInZone> deck) {
		if (deck.isEmpty()) {
			return List.of();
		}
		int look = Math.min(3, deck.size());
		List<CardInZone> top = new ArrayList<>();
		for (int i = 0; i < look; i++) {
			top.add(deck.remove(0));
		}
		return top;
	}

	public void resolveAncientKnowledge(
		List<CardInZone> scryCards,
		List<CardInZone> deck,
		List<CardInZone> hand,
		String pickedInstanceId
	) {
		CardInZone picked = scryCards.stream()
			.filter(card -> card.getInstanceId().equals(pickedInstanceId))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException("Карта не найдена среди вариантов"));
		List<CardInZone> remainder = new ArrayList<>(scryCards);
		remainder.remove(picked);
		hand.add(picked);
		Collections.shuffle(remainder);
		deck.addAll(remainder);
	}

	public void resolveAncientKnowledgeAuto(List<CardInZone> scryCards, List<CardInZone> deck, List<CardInZone> hand) {
		if (scryCards.isEmpty()) {
			return;
		}
		resolveAncientKnowledge(scryCards, deck, hand, scryCards.get(0).getInstanceId());
	}

	public boolean canAttackFace(CreatureOnBoard attacker, List<CreatureOnBoard> opponentBoard) {
		List<CreatureOnBoard> aliveOpponents = opponentBoard.stream()
			.filter(CreatureOnBoard::isAlive)
			.toList();
		if (hasAliveTaunt(aliveOpponents)) {
			return false;
		}
		if (aliveOpponents.isEmpty()) {
			return true;
		}
		CardDefinition attackerCard = requireCard(attacker.getCardDefinitionId());
		boolean attackerFlies = hasAbility(attackerCard, AbilityKey.FLIGHT)
			|| hasAbility(attackerCard, AbilityKey.INTERCEPT);
		if (attackerFlies) {
			return !hasFlyingOrInterceptOnBoard(aliveOpponents);
		}
		return !hasGroundBlockerOnBoard(aliveOpponents);
	}

	public boolean hasAliveTaunt(List<CreatureOnBoard> board) {
		return board.stream()
			.filter(CreatureOnBoard::isAlive)
			.anyMatch(creature -> hasAbility(requireCard(creature.getCardDefinitionId()), AbilityKey.TAUNT));
	}

	private boolean hasFlyingOrInterceptOnBoard(List<CreatureOnBoard> board) {
		return board.stream()
			.filter(CreatureOnBoard::isAlive)
			.anyMatch(creature -> {
				CardDefinition card = requireCard(creature.getCardDefinitionId());
				return hasAbility(card, AbilityKey.FLIGHT) || hasAbility(card, AbilityKey.INTERCEPT);
			});
	}

	private boolean hasGroundBlockerOnBoard(List<CreatureOnBoard> board) {
		return board.stream()
			.filter(CreatureOnBoard::isAlive)
			.anyMatch(creature -> {
				CardDefinition card = requireCard(creature.getCardDefinitionId());
				return !hasAbility(card, AbilityKey.FLIGHT) && !hasAbility(card, AbilityKey.INTERCEPT);
			});
	}

	private boolean hasOtherTreantWithAttackAbove(
		List<CreatureOnBoard> friendlyBoard,
		CreatureOnBoard self,
		int minAttackExclusive
	) {
		return friendlyBoard.stream()
			.filter(CreatureOnBoard::isAlive)
			.filter(creature -> !creature.getInstanceId().equals(self.getInstanceId()))
			.anyMatch(creature -> {
				CardDefinition allyCard = cardDefinitionRepository.findById(creature.getCardDefinitionId()).orElse(null);
				return allyCard != null
					&& isTreant(allyCard)
					&& creature.getAttack() > minAttackExclusive;
			});
	}

	private boolean isTreant(CardDefinition card) {
		return card.getCreatureTypes() != null && card.getCreatureTypes().contains(TREEMAN_TYPE);
	}

	private CardAbilityDto findAbility(CardDefinition card, AbilityKey abilityKey) {
		return getAbilities(card.getId()).stream()
			.filter(ability -> abilityKey.name().equals(ability.getKey()))
			.findFirst()
			.orElseThrow();
	}

	private CardDefinition requireCard(Long cardDefinitionId) {
		return cardDefinitionRepository.findById(cardDefinitionId)
			.orElseThrow(() -> new IllegalStateException("Карта не найдена: " + cardDefinitionId));
	}
}
