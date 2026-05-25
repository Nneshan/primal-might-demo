package com.example.demo.game;

public class CreatureOnBoard {

	private String instanceId;
	private Long cardDefinitionId;
	private int currentHealth;
	private int boardIndex;
	private int attack;
	private int defense;
	private int initiative;
	/** false в ход разыгрывания и после атаки в этом ходу */
	private boolean canAttack;

	public String getInstanceId() {
		return instanceId;
	}

	public void setInstanceId(String instanceId) {
		this.instanceId = instanceId;
	}

	public Long getCardDefinitionId() {
		return cardDefinitionId;
	}

	public void setCardDefinitionId(Long cardDefinitionId) {
		this.cardDefinitionId = cardDefinitionId;
	}

	public int getCurrentHealth() {
		return currentHealth;
	}

	public void setCurrentHealth(int currentHealth) {
		this.currentHealth = currentHealth;
	}

	public int getBoardIndex() {
		return boardIndex;
	}

	public void setBoardIndex(int boardIndex) {
		this.boardIndex = boardIndex;
	}

	public int getAttack() {
		return attack;
	}

	public void setAttack(int attack) {
		this.attack = attack;
	}

	public int getDefense() {
		return defense;
	}

	public void setDefense(int defense) {
		this.defense = defense;
	}

	public int getInitiative() {
		return initiative;
	}

	public void setInitiative(int initiative) {
		this.initiative = initiative;
	}

	public boolean isCanAttack() {
		return canAttack;
	}

	public void setCanAttack(boolean canAttack) {
		this.canAttack = canAttack;
	}

	public boolean isAlive() {
		return currentHealth > 0;
	}
}
