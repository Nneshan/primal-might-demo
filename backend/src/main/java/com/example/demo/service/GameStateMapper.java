package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.example.demo.dto.BoardCreatureDto;
import com.example.demo.dto.CardViewDto;
import com.example.demo.dto.GameStateResponseDto;
import com.example.demo.dto.HandCardDto;
import com.example.demo.entity.CardDefinition;
import com.example.demo.game.CardInZone;
import com.example.demo.game.CreatureOnBoard;
import com.example.demo.game.GamePhase;
import com.example.demo.game.GameState;
import com.example.demo.game.PendingChoiceType;
import com.example.demo.game.TurnOwner;
import com.example.demo.repository.CardDefinitionRepository;

@Component
public class GameStateMapper {

	private final CardDefinitionRepository cardDefinitionRepository;
	private final CardCatalogService cardCatalogService;
	private final AbilityService abilityService;

	public GameStateMapper(
		CardDefinitionRepository cardDefinitionRepository,
		CardCatalogService cardCatalogService,
		AbilityService abilityService
	) {
		this.cardDefinitionRepository = cardDefinitionRepository;
		this.cardCatalogService = cardCatalogService;
		this.abilityService = abilityService;
	}

	public GameStateResponseDto toDto(GameState state) {
		Map<Long, CardDefinition> definitions = cardDefinitionRepository.findAll().stream()
			.collect(Collectors.toMap(CardDefinition::getId, Function.identity()));

		GameStateResponseDto dto = new GameStateResponseDto();
		dto.setGameId(state.getGameId());
		dto.setPhase(state.getPhase());
		dto.setTurnOwner(state.getTurnOwner());
		dto.setTurnNumber(state.getTurnNumber());
		dto.setPlayerHealth(state.getPlayerHealth());
		dto.setOpponentHealth(state.getOpponentHealth());
		dto.setPlayerMana(state.getPlayerMana());
		dto.setPlayerMaxMana(state.getPlayerMaxMana());
		dto.setOpponentMana(state.getOpponentMana());
		dto.setOpponentMaxMana(state.getOpponentMaxMana());
		dto.setPlayerDeckSize(state.getPlayerDeck().size());
		dto.setOpponentDeckSize(state.getOpponentDeck().size());
		dto.setOpponentHandSize(state.getOpponentHand().size());
		dto.setPlayerHand(mapPlayerHand(state, definitions));
		dto.setPlayerBoard(mapBoard(state.getPlayerBoard(), definitions, state.getPlayerBoard(), null, null));
		dto.setOpponentBoard(mapOpponentBoard(state, definitions));
		dto.setAttackQueue(state.getAttackQueue());
		dto.setAttackQueueIndex(state.getAttackQueueIndex());
		dto.setCurrentAttackerInstanceId(state.getCurrentAttackerInstanceId());
		dto.setLastMessage(state.getLastMessage());
		dto.setGameOver(state.isGameOver());
		dto.setWinner(state.getWinner());
		dto.setPendingChoice(state.getPendingChoice());
		if (state.getPendingChoice() == PendingChoiceType.ANCIENT_KNOWLEDGE) {
			dto.setScryOptions(mapHand(state.getPendingScryCards(), definitions));
		}
		dto.setCanAttackFace(computeCanAttackFace(state));
		return dto;
	}

	private boolean computeCanAttackFace(GameState state) {
		if (state.hasPendingChoice() || state.getPhase() != GamePhase.ATTACK || state.getTurnOwner() != TurnOwner.PLAYER) {
			return false;
		}
		String attackerId = state.getCurrentAttackerInstanceId();
		if (attackerId == null) {
			return false;
		}
		CreatureOnBoard attacker = state.getPlayerBoard().stream()
			.filter(creature -> creature.getInstanceId().equals(attackerId))
			.findFirst()
			.orElse(null);
		return attacker != null
			&& attacker.isCanAttack()
			&& abilityService.canAttackFace(attacker, state.getOpponentBoard());
	}

	private List<HandCardDto> mapHand(List<CardInZone> hand, Map<Long, CardDefinition> definitions) {
		List<HandCardDto> result = new ArrayList<>();
		for (int i = 0; i < hand.size(); i++) {
			CardInZone zoneCard = hand.get(i);
			HandCardDto dto = new HandCardDto();
			dto.setInstanceId(zoneCard.getInstanceId());
			dto.setHandIndex(i);
			dto.setCard(cardCatalogService.toDto(definitions.get(zoneCard.getCardDefinitionId())));
			result.add(dto);
		}
		return result;
	}

	private List<HandCardDto> mapPlayerHand(GameState state, Map<Long, CardDefinition> definitions) {
		List<HandCardDto> result = new ArrayList<>();
		for (int i = 0; i < state.getPlayerHand().size(); i++) {
			CardInZone zoneCard = state.getPlayerHand().get(i);
			CardDefinition definition = definitions.get(zoneCard.getCardDefinitionId());
			HandCardDto dto = new HandCardDto();
			dto.setInstanceId(zoneCard.getInstanceId());
			dto.setHandIndex(i);
			dto.setCard(cardCatalogService.toDto(definition));
			dto.setPlayable(canPlayCard(state, definition));
			result.add(dto);
		}
		return result;
	}

	private boolean canPlayCard(GameState state, CardDefinition definition) {
		if (definition == null || state.isGameOver() || state.hasPendingChoice()) {
			return false;
		}
		return state.getPhase() == GamePhase.PLAY
			&& state.getTurnOwner() == TurnOwner.PLAYER
			&& definition.getManaCost() <= state.getPlayerMana();
	}

	private List<BoardCreatureDto> mapOpponentBoard(GameState state, Map<Long, CardDefinition> definitions) {
		CreatureOnBoard attacker = findCurrentPlayerAttacker(state);
		return mapBoard(
			state.getOpponentBoard(),
			definitions,
			state.getOpponentBoard(),
			attacker,
			state.getOpponentBoard()
		);
	}

	private CreatureOnBoard findCurrentPlayerAttacker(GameState state) {
		if (state.getPhase() != GamePhase.ATTACK || state.getTurnOwner() != TurnOwner.PLAYER) {
			return null;
		}
		String attackerId = state.getCurrentAttackerInstanceId();
		if (attackerId == null) {
			return null;
		}
		return state.getPlayerBoard().stream()
			.filter(creature -> creature.getInstanceId().equals(attackerId))
			.findFirst()
			.orElse(null);
	}

	private List<BoardCreatureDto> mapBoard(
		List<CreatureOnBoard> board,
		Map<Long, CardDefinition> definitions,
		List<CreatureOnBoard> friendlyBoard,
		CreatureOnBoard currentAttacker,
		List<CreatureOnBoard> defenderBoardForAttack
	) {
		List<BoardCreatureDto> result = new ArrayList<>();
		for (CreatureOnBoard creature : board) {
			BoardCreatureDto dto = new BoardCreatureDto();
			dto.setInstanceId(creature.getInstanceId());
			dto.setBoardIndex(creature.getBoardIndex());
			dto.setCurrentHealth(creature.getCurrentHealth());
			dto.setCanAttack(creature.isCanAttack());
			int effectiveAttack = abilityService.getEffectiveAttack(creature, friendlyBoard);
			int effectiveDefense = abilityService.getEffectiveDefense(creature, friendlyBoard);
			dto.setEffectiveAttack(effectiveAttack);
			dto.setEffectiveDefense(effectiveDefense);
			dto.setEffectiveInitiative(abilityService.getEffectiveInitiative(creature, friendlyBoard));
			if (currentAttacker != null
				&& currentAttacker.isCanAttack()
				&& defenderBoardForAttack != null
				&& creature.isAlive()) {
				dto.setAttackable(abilityService.canAttackAsTarget(currentAttacker, creature, defenderBoardForAttack));
			}
			else if (defenderBoardForAttack != null) {
				dto.setAttackable(false);
			}
			dto.setCard(cardCatalogService.toDto(definitions.get(creature.getCardDefinitionId())));
			result.add(dto);
		}
		return result;
	}

}
