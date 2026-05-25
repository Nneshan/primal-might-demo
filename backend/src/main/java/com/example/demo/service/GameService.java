package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.CardDefinition;
import com.example.demo.entity.GameSession;
import com.example.demo.exception.GameRuleException;
import com.example.demo.game.AbilityKey;
import com.example.demo.game.AttackTargetType;
import com.example.demo.game.CardInZone;
import com.example.demo.game.CreatureOnBoard;
import com.example.demo.game.GamePhase;
import com.example.demo.game.GameState;
import com.example.demo.game.PendingChoiceType;
import com.example.demo.game.TurnOwner;
import com.example.demo.dto.GameStateResponseDto;
import com.example.demo.repository.CardDefinitionRepository;
import com.example.demo.repository.GameSessionRepository;

@Service
public class GameService {

	private final GameSessionRepository gameSessionRepository;
	private final CardDefinitionRepository cardDefinitionRepository;
	private final GameStatePersistence gameStatePersistence;
	private final DeckFactory deckFactory;
	private final CombatService combatService;
	private final AbilityService abilityService;
	private final AiService aiService;
	private final GameStateMapper gameStateMapper;

	public GameService(
		GameSessionRepository gameSessionRepository,
		CardDefinitionRepository cardDefinitionRepository,
		GameStatePersistence gameStatePersistence,
		DeckFactory deckFactory,
		CombatService combatService,
		AbilityService abilityService,
		AiService aiService,
		GameStateMapper gameStateMapper
	) {
		this.gameSessionRepository = gameSessionRepository;
		this.cardDefinitionRepository = cardDefinitionRepository;
		this.gameStatePersistence = gameStatePersistence;
		this.deckFactory = deckFactory;
		this.combatService = combatService;
		this.abilityService = abilityService;
		this.aiService = aiService;
		this.gameStateMapper = gameStateMapper;
	}

	@Transactional
	public GameStateResponseDto createGame() {
		Map<String, CardDefinition> cardsByName = cardDefinitionRepository.findAll().stream()
			.collect(Collectors.toMap(CardDefinition::getName, Function.identity()));

		GameState state = new GameState();
		state.setPlayerDeck(deckFactory.buildDeck(starterDeckIds(cardsByName)));
		state.setOpponentDeck(deckFactory.buildDeck(opponentDeckIds(cardsByName)));
		deckFactory.drawCards(state.getPlayerDeck(), state.getPlayerHand(), GameState.OPENING_HAND_SIZE);
		deckFactory.drawCards(state.getOpponentDeck(), state.getOpponentHand(), GameState.OPENING_HAND_SIZE);

		GameSession session = new GameSession();
		session.setStateJson(gameStatePersistence.toJson(state));
		session = gameSessionRepository.save(session);
		state.setGameId(session.getId());
		session.setStateJson(gameStatePersistence.toJson(state));
		gameSessionRepository.save(session);
		return gameStateMapper.toDto(state);
	}

	@Transactional(readOnly = true)
	public GameStateResponseDto getGame(Long gameId) {
		return gameStateMapper.toDto(loadState(gameId));
	}

	@Transactional
	public GameStateResponseDto resolveAncientKnowledge(Long gameId, String pickedInstanceId) {
		GameState state = loadState(gameId);
		ensurePlayerTurn(state);
		ensurePendingChoice(state, PendingChoiceType.ANCIENT_KNOWLEDGE);

		List<CardInZone> scryCards = state.getPendingScryCards();
		boolean validPick = scryCards.stream().anyMatch(card -> card.getInstanceId().equals(pickedInstanceId));
		if (!validPick) {
			throw new GameRuleException("Выберите одну из показанных карт");
		}

		try {
			abilityService.resolveAncientKnowledge(scryCards, state.getPlayerDeck(), state.getPlayerHand(), pickedInstanceId);
		}
		catch (IllegalArgumentException exception) {
			throw new GameRuleException(exception.getMessage());
		}
		state.getPendingScryCards().clear();
		state.setPendingChoice(null);
		state.setLastMessage("Древние Знания: карта добавлена в руку");
		return saveAndMap(gameId, state);
	}

	@Transactional
	public GameStateResponseDto playCard(Long gameId, int handIndex) {
		GameState state = loadState(gameId);
		ensurePlayerTurn(state);
		ensureNoPendingChoice(state);
		ensurePhase(state, GamePhase.PLAY);
		if (handIndex < 0 || handIndex >= state.getPlayerHand().size()) {
			throw new GameRuleException("Неверный индекс карты в руке");
		}

		CardInZone card = state.getPlayerHand().get(handIndex);
		CardDefinition definition = cardDefinitionRepository.findById(card.getCardDefinitionId())
			.orElseThrow(() -> new GameRuleException("Карта не найдена в каталоге"));
		if (definition.getManaCost() > state.getPlayerMana()) {
			throw new GameRuleException("Недостаточно маны");
		}

		state.getPlayerHand().remove(handIndex);
		state.setPlayerMana(state.getPlayerMana() - definition.getManaCost());
		state.getPlayerBoard().add(toCreature(card, definition, nextBoardIndex(state.getPlayerBoard())));
		if (abilityService.hasAbility(definition, AbilityKey.ANCIENT_KNOWLEDGE)) {
			List<CardInZone> scryCards = abilityService.beginAncientKnowledge(state.getPlayerDeck());
			if (scryCards.isEmpty()) {
				state.setLastMessage("Вы разыграли: " + definition.getName());
			}
			else {
				state.setPendingChoice(PendingChoiceType.ANCIENT_KNOWLEDGE);
				state.setPendingScryCards(scryCards);
				state.setLastMessage("Древние Знания: выберите 1 карту из " + scryCards.size());
			}
		}
		else {
			state.setLastMessage("Вы разыграли: " + definition.getName());
		}
		checkGameOver(state);
		return saveAndMap(gameId, state);
	}

	@Transactional
	public GameStateResponseDto endPlayPhase(Long gameId) {
		GameState state = loadState(gameId);
		ensurePlayerTurn(state);
		ensureNoPendingChoice(state);
		ensurePhase(state, GamePhase.PLAY);

		state.setPhase(GamePhase.ATTACK);
		state.setAttackQueue(combatService.buildAttackQueue(state.getPlayerBoard()));
		state.setAttackQueueIndex(0);
		return saveAndMap(gameId, state);
	}

	@Transactional
	public GameStateResponseDto attack(Long gameId, String attackerInstanceId, AttackTargetType targetType, String targetInstanceId) {
		GameState state = loadState(gameId);
		ensurePlayerTurn(state);
		ensureNoPendingChoice(state);
		ensurePhase(state, GamePhase.ATTACK);
		validateCurrentAttacker(state, attackerInstanceId);

		CreatureOnBoard attacker = combatService.findCreature(state.getPlayerBoard(), attackerInstanceId);
		if (attacker == null || !attacker.isCanAttack()) {
			throw new GameRuleException("Это существо не может атаковать");
		}

		if (targetType == AttackTargetType.OPPONENT) {
			if (!abilityService.canAttackFace(attacker, state.getOpponentBoard())) {
				throw new GameRuleException(
					"Прямая атака недоступна: нужен Полёт и отсутствие вражеских летающих/перехватчиков, либо пустое поле"
				);
			}
			combatService.applyFaceAttack(attacker, state, true, state.getPlayerBoard());
			state.setLastMessage("Прямая атака по оппоненту");
		}
		else {
			CreatureOnBoard defender = combatService.findCreature(state.getOpponentBoard(), targetInstanceId);
			if (defender == null) {
				throw new GameRuleException("Цель не найдена");
			}
			if (!abilityService.canAttackCreature(attacker, defender)) {
				throw new GameRuleException("Эту цель нельзя атаковать без Полёта или Перехвата");
			}
			if (!abilityService.mustAttackTaunt(state.getOpponentBoard(), defender)) {
				throw new GameRuleException("Сначала атакуйте существо с Защитником");
			}
			combatService.applyCreatureCombat(
				attacker,
				defender,
				state.getPlayerBoard(),
				state.getOpponentBoard()
			);
			state.setLastMessage(buildCombatMessage(attacker, defender, state.getPlayerBoard(), state.getOpponentBoard()));
		}

		combatService.removeDeadCreatures(state.getPlayerBoard());
		combatService.removeDeadCreatures(state.getOpponentBoard());
		checkGameOver(state);
		advanceAttackQueue(state);
		return saveAndMap(gameId, state);
	}

	@Transactional
	public GameStateResponseDto skipAttack(Long gameId) {
		GameState state = loadState(gameId);
		ensurePlayerTurn(state);
		ensureNoPendingChoice(state);
		ensurePhase(state, GamePhase.ATTACK);
		String current = state.getCurrentAttackerInstanceId();
		if (current == null) {
			throw new GameRuleException("Нет активного атакующего");
		}
		CreatureOnBoard attacker = combatService.findCreature(state.getPlayerBoard(), current);
		if (attacker != null) {
			attacker.setCanAttack(false);
		}
		state.setLastMessage("Атака пропущена");
		advanceAttackQueue(state);
		return saveAndMap(gameId, state);
	}

	@Transactional
	public GameStateResponseDto endAttackPhase(Long gameId) {
		GameState state = loadState(gameId);
		ensurePlayerTurn(state);
		ensureNoPendingChoice(state);
		ensurePhase(state, GamePhase.ATTACK);

		state.setAttackQueue(List.of());
		state.setAttackQueueIndex(0);
		aiService.runOpponentTurn(state);
		if (!state.isGameOver()) {
			beginPlayerTurn(state);
		}
		return saveAndMap(gameId, state);
	}

	@Transactional
	public GameStateResponseDto addRewardCardsToPlayerDeck(Long gameId, List<Long> cardDefinitionIds) {
		GameState state = loadState(gameId);
		if (cardDefinitionIds == null || cardDefinitionIds.isEmpty()) {
			throw new GameRuleException("Список наградных карт пуст");
		}
		deckFactory.addCardsToDeck(state.getPlayerDeck(), cardDefinitionIds);
		state.setLastMessage("В колоду добавлено карт: " + cardDefinitionIds.size());
		return saveAndMap(gameId, state);
	}

	private void beginPlayerTurn(GameState state) {
		state.setTurnNumber(state.getTurnNumber() + 1);
		state.setTurnOwner(TurnOwner.PLAYER);
		state.setPhase(GamePhase.PLAY);

		state.setPlayerMaxMana(Math.min(GameState.MAX_MANA, state.getPlayerMaxMana() + 1));
		state.setPlayerMana(state.getPlayerMaxMana());

		if (state.getTurnNumber() > 1) {
			deckFactory.drawCards(state.getPlayerDeck(), state.getPlayerHand(), 1);
		}

		for (CreatureOnBoard creature : state.getPlayerBoard()) {
			if (creature.isAlive()) {
				creature.setCanAttack(true);
			}
		}

		state.setLastMessage("Ваш ход " + state.getTurnNumber() + ". Фаза разыгрывания.");
	}

	private void advanceAttackQueue(GameState state) {
		state.setAttackQueueIndex(state.getAttackQueueIndex() + 1);
	}

	private CreatureOnBoard toCreature(CardInZone card, CardDefinition definition, int boardIndex) {
		CreatureOnBoard creature = new CreatureOnBoard();
		creature.setInstanceId(card.getInstanceId());
		creature.setCardDefinitionId(definition.getId());
		creature.setCurrentHealth(definition.getHealth());
		creature.setAttack(definition.getAttack());
		creature.setDefense(definition.getDefense());
		creature.setInitiative(definition.getInitiative());
		creature.setBoardIndex(boardIndex);
		creature.setCanAttack(false);
		return creature;
	}

	private int nextBoardIndex(List<CreatureOnBoard> board) {
		return board.stream().mapToInt(CreatureOnBoard::getBoardIndex).max().orElse(-1) + 1;
	}

	private void validateCurrentAttacker(GameState state, String attackerInstanceId) {
		String current = state.getCurrentAttackerInstanceId();
		if (current == null || !current.equals(attackerInstanceId)) {
			throw new GameRuleException("Сейчас атакует другое существо");
		}
	}

	private void ensurePlayerTurn(GameState state) {
		if (state.isGameOver()) {
			throw new GameRuleException("Игра уже окончена");
		}
		if (state.getTurnOwner() != TurnOwner.PLAYER) {
			throw new GameRuleException("Сейчас ход противника");
		}
	}

	private void ensurePhase(GameState state, GamePhase phase) {
		if (state.getPhase() != phase) {
			throw new GameRuleException("Неверная фаза хода");
		}
	}

	private void ensureNoPendingChoice(GameState state) {
		if (state.hasPendingChoice()) {
			throw new GameRuleException("Сначала завершите выбор «Древних знаний»");
		}
	}

	private void ensurePendingChoice(GameState state, PendingChoiceType expected) {
		if (state.getPendingChoice() != expected) {
			throw new GameRuleException("Сейчас нет ожидающего выбора");
		}
	}

	private void checkGameOver(GameState state) {
		if (state.getPlayerHealth() <= 0) {
			state.setGameOver(true);
			state.setWinner("OPPONENT");
			state.setLastMessage("Поражение");
		}
		else if (state.getOpponentHealth() <= 0) {
			state.setGameOver(true);
			state.setWinner("PLAYER");
			state.setLastMessage("Победа!");
		}
	}

	private GameState loadState(Long gameId) {
		GameSession session = gameSessionRepository.findById(gameId)
			.orElseThrow(() -> new GameRuleException("Игра не найдена"));
		GameState state = gameStatePersistence.fromJson(session.getStateJson());
		state.setGameId(gameId);
		return state;
	}

	private GameStateResponseDto saveAndMap(Long gameId, GameState state) {
		GameSession session = gameSessionRepository.findById(gameId)
			.orElseThrow(() -> new GameRuleException("Игра не найдена"));
		session.setStateJson(gameStatePersistence.toJson(state));
		gameSessionRepository.save(session);
		return gameStateMapper.toDto(state);
	}

	private List<Long> starterDeckIds(Map<String, CardDefinition> cardsByName) {
		List<Long> deck = new ArrayList<>();
		for (int i = 0; i < 8; i++) {
			deck.add(card(cardsByName, "Флороид"));
		}
		for (int i = 0; i < 4; i++) {
			deck.add(card(cardsByName, "Элдорн"));
		}
		deck.add(card(cardsByName, "Корнестраж"));
		deck.add(card(cardsByName, "Корнестраж"));
		deck.add(card(cardsByName, "Дриада"));
		deck.add(card(cardsByName, "Дриада"));
		deck.add(card(cardsByName, "Гонец облаков"));
		deck.add(card(cardsByName, "Гонец облаков"));
		deck.add(card(cardsByName, "Гонец облаков"));
		return deck;
	}

	private List<Long> opponentDeckIds(Map<String, CardDefinition> cardsByName) {
		return List.of(
			card(cardsByName, "Мрачнодрев"),
			card(cardsByName, "Мрачнодрев"),
			card(cardsByName, "Элдорн"),
			card(cardsByName, "Корнестраж"),
			card(cardsByName, "Корнестраж"),
			card(cardsByName, "Дриада"),
			card(cardsByName, "Дриада"),
			card(cardsByName, "Гонец облаков"),
			card(cardsByName, "Гонец облаков"),
			card(cardsByName, "Флороид"),
			card(cardsByName, "Флороид")
		);
	}

	private Long card(Map<String, CardDefinition> cardsByName, String name) {
		CardDefinition card = cardsByName.get(name);
		if (card == null) {
			throw new IllegalStateException("Карта не найдена в каталоге: " + name);
		}
		return card.getId();
	}

	private String buildCombatMessage(
		CreatureOnBoard attacker,
		CreatureOnBoard defender,
		List<CreatureOnBoard> attackerBoard,
		List<CreatureOnBoard> defenderBoard
	) {
		int damage = abilityService.computeDamageToDefender(attacker, defender, attackerBoard, defenderBoard);
		int counter = abilityService.computeCounterDamage(attacker, defender, attackerBoard, defenderBoard);
		return "Бой: " + damage + " урона цели, ответный урон " + counter;
	}
}
