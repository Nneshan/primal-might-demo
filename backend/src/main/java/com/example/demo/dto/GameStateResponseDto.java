package com.example.demo.dto;

import java.util.List;

import com.example.demo.game.GamePhase;
import com.example.demo.game.PendingChoiceType;
import com.example.demo.game.TurnOwner;

public class GameStateResponseDto {

	private Long gameId;
	private GamePhase phase;
	private TurnOwner turnOwner;
	private int turnNumber;

	private int playerHealth;
	private int opponentHealth;
	private int playerMana;
	private int playerMaxMana;
	private int opponentMana;
	private int opponentMaxMana;

	private int playerDeckSize;
	private int opponentDeckSize;
	private int opponentHandSize;

	private List<HandCardDto> playerHand;
	private List<BoardCreatureDto> playerBoard;
	private List<BoardCreatureDto> opponentBoard;

	private List<String> attackQueue;
	private int attackQueueIndex;
	private String currentAttackerInstanceId;
	private String lastMessage;

	private boolean gameOver;
	private String winner;

	private PendingChoiceType pendingChoice;
	private List<HandCardDto> scryOptions;
	private boolean canAttackFace;

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

	public int getPlayerDeckSize() {
		return playerDeckSize;
	}

	public void setPlayerDeckSize(int playerDeckSize) {
		this.playerDeckSize = playerDeckSize;
	}

	public int getOpponentDeckSize() {
		return opponentDeckSize;
	}

	public void setOpponentDeckSize(int opponentDeckSize) {
		this.opponentDeckSize = opponentDeckSize;
	}

	public int getOpponentHandSize() {
		return opponentHandSize;
	}

	public void setOpponentHandSize(int opponentHandSize) {
		this.opponentHandSize = opponentHandSize;
	}

	public List<HandCardDto> getPlayerHand() {
		return playerHand;
	}

	public void setPlayerHand(List<HandCardDto> playerHand) {
		this.playerHand = playerHand;
	}

	public List<BoardCreatureDto> getPlayerBoard() {
		return playerBoard;
	}

	public void setPlayerBoard(List<BoardCreatureDto> playerBoard) {
		this.playerBoard = playerBoard;
	}

	public List<BoardCreatureDto> getOpponentBoard() {
		return opponentBoard;
	}

	public void setOpponentBoard(List<BoardCreatureDto> opponentBoard) {
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

	public String getCurrentAttackerInstanceId() {
		return currentAttackerInstanceId;
	}

	public void setCurrentAttackerInstanceId(String currentAttackerInstanceId) {
		this.currentAttackerInstanceId = currentAttackerInstanceId;
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

	public PendingChoiceType getPendingChoice() {
		return pendingChoice;
	}

	public void setPendingChoice(PendingChoiceType pendingChoice) {
		this.pendingChoice = pendingChoice;
	}

	public List<HandCardDto> getScryOptions() {
		return scryOptions;
	}

	public void setScryOptions(List<HandCardDto> scryOptions) {
		this.scryOptions = scryOptions;
	}

	public boolean isCanAttackFace() {
		return canAttackFace;
	}

	public void setCanAttackFace(boolean canAttackFace) {
		this.canAttackFace = canAttackFace;
	}
}
