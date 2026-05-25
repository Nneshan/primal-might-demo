package com.example.demo.game;

import java.util.ArrayList;
import java.util.List;

public class GameState {

	public static final int STARTING_HEALTH = 20;
	public static final int STARTING_MANA = 2;
	public static final int MAX_MANA = 10;
	public static final int OPENING_HAND_SIZE = 4;

	private Long gameId;
	private GamePhase phase = GamePhase.PLAY;
	private TurnOwner turnOwner = TurnOwner.PLAYER;
	private int turnNumber = 1;

	private int playerHealth = STARTING_HEALTH;
	private int opponentHealth = STARTING_HEALTH;
	private int playerMana = STARTING_MANA;
	private int playerMaxMana = STARTING_MANA;
	private int opponentMana = STARTING_MANA;
	private int opponentMaxMana = STARTING_MANA;

	private List<CardInZone> playerDeck = new ArrayList<>();
	private List<CardInZone> playerHand = new ArrayList<>();
	private List<CreatureOnBoard> playerBoard = new ArrayList<>();

	private List<CardInZone> opponentDeck = new ArrayList<>();
	private List<CardInZone> opponentHand = new ArrayList<>();
	private List<CreatureOnBoard> opponentBoard = new ArrayList<>();

	private List<String> attackQueue = new ArrayList<>();
	private int attackQueueIndex;
	private String lastMessage = "Игра началась. Ваша фаза разыгрывания.";

	private boolean gameOver;
	private String winner;

	private PendingChoiceType pendingChoice;
	private List<CardInZone> pendingScryCards = new ArrayList<>();

	public Long getGameId() {
		return gameId;
	}

	public void setGameId(Long gameId) {
		this.gameId = gameId;
	}

	public GamePhase getPhase() {
		return phase;
	}

	public void setPhase(GamePhase phase) {
		this.phase = phase;
	}

	public TurnOwner getTurnOwner() {
		return turnOwner;
	}

	public void setTurnOwner(TurnOwner turnOwner) {
		this.turnOwner = turnOwner;
	}

	public int getTurnNumber() {
		return turnNumber;
	}

	public void setTurnNumber(int turnNumber) {
		this.turnNumber = turnNumber;
	}

	public int getPlayerHealth() {
		return playerHealth;
	}

	public void setPlayerHealth(int playerHealth) {
		this.playerHealth = playerHealth;
	}

	public int getOpponentHealth() {
		return opponentHealth;
	}

	public void setOpponentHealth(int opponentHealth) {
		this.opponentHealth = opponentHealth;
	}

	public int getPlayerMana() {
		return playerMana;
	}

	public void setPlayerMana(int playerMana) {
		this.playerMana = playerMana;
	}

	public int getPlayerMaxMana() {
		return playerMaxMana;
	}

	public void setPlayerMaxMana(int playerMaxMana) {
		this.playerMaxMana = playerMaxMana;
	}

	public int getOpponentMana() {
		return opponentMana;
	}

	public void setOpponentMana(int opponentMana) {
		this.opponentMana = opponentMana;
	}

	public int getOpponentMaxMana() {
		return opponentMaxMana;
	}

	public void setOpponentMaxMana(int opponentMaxMana) {
		this.opponentMaxMana = opponentMaxMana;
	}

	public List<CardInZone> getPlayerDeck() {
		return playerDeck;
	}

	public void setPlayerDeck(List<CardInZone> playerDeck) {
		this.playerDeck = playerDeck;
	}

	public List<CardInZone> getPlayerHand() {
		return playerHand;
	}

	public void setPlayerHand(List<CardInZone> playerHand) {
		this.playerHand = playerHand;
	}

	public List<CreatureOnBoard> getPlayerBoard() {
		return playerBoard;
	}

	public void setPlayerBoard(List<CreatureOnBoard> playerBoard) {
		this.playerBoard = playerBoard;
	}

	public List<CardInZone> getOpponentDeck() {
		return opponentDeck;
	}

	public void setOpponentDeck(List<CardInZone> opponentDeck) {
		this.opponentDeck = opponentDeck;
	}

	public List<CardInZone> getOpponentHand() {
		return opponentHand;
	}

	public void setOpponentHand(List<CardInZone> opponentHand) {
		this.opponentHand = opponentHand;
	}

	public List<CreatureOnBoard> getOpponentBoard() {
		return opponentBoard;
	}

	public void setOpponentBoard(List<CreatureOnBoard> opponentBoard) {
		this.opponentBoard = opponentBoard;
	}

	public List<String> getAttackQueue() {
		return attackQueue;
	}

	public void setAttackQueue(List<String> attackQueue) {
		this.attackQueue = attackQueue;
	}

	public int getAttackQueueIndex() {
		return attackQueueIndex;
	}

	public void setAttackQueueIndex(int attackQueueIndex) {
		this.attackQueueIndex = attackQueueIndex;
	}

	public String getLastMessage() {
		return lastMessage;
	}

	public void setLastMessage(String lastMessage) {
		this.lastMessage = lastMessage;
	}

	public boolean isGameOver() {
		return gameOver;
	}

	public void setGameOver(boolean gameOver) {
		this.gameOver = gameOver;
	}

	public String getWinner() {
		return winner;
	}

	public void setWinner(String winner) {
		this.winner = winner;
	}

	public String getCurrentAttackerInstanceId() {
		if (phase != GamePhase.ATTACK || attackQueue.isEmpty() || attackQueueIndex >= attackQueue.size()) {
			return null;
		}
		return attackQueue.get(attackQueueIndex);
	}

	public PendingChoiceType getPendingChoice() {
		return pendingChoice;
	}

	public void setPendingChoice(PendingChoiceType pendingChoice) {
		this.pendingChoice = pendingChoice;
	}

	public List<CardInZone> getPendingScryCards() {
		return pendingScryCards;
	}

	public void setPendingScryCards(List<CardInZone> pendingScryCards) {
		this.pendingScryCards = pendingScryCards != null ? pendingScryCards : new ArrayList<>();
	}

	public boolean hasPendingChoice() {
		return pendingChoice != null;
	}
}
