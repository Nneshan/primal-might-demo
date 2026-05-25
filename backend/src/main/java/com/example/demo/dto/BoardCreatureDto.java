package com.example.demo.dto;

public class BoardCreatureDto {

	private String instanceId;
	private int boardIndex;
	private int currentHealth;
	private boolean canAttack;
	private Integer effectiveAttack;
	private Integer effectiveDefense;
	private Integer effectiveInitiative;
	private Boolean attackable;
	private CardViewDto card;

	public String getInstanceId() {
		return instanceId;
	}

	public void setInstanceId(String instanceId) {
		this.instanceId = instanceId;
	}

	public int getBoardIndex() {
		return boardIndex;
	}

	public void setBoardIndex(int boardIndex) {
		this.boardIndex = boardIndex;
	}

	public int getCurrentHealth() {
		return currentHealth;
	}

	public void setCurrentHealth(int currentHealth) {
		this.currentHealth = currentHealth;
	}

	public boolean isCanAttack() {
		return canAttack;
	}

	public void setCanAttack(boolean canAttack) {
		this.canAttack = canAttack;
	}

	public Integer getEffectiveAttack() {
		return effectiveAttack;
	}

	public void setEffectiveAttack(Integer effectiveAttack) {
		this.effectiveAttack = effectiveAttack;
	}

	public Integer getEffectiveDefense() {
		return effectiveDefense;
	}

	public void setEffectiveDefense(Integer effectiveDefense) {
		this.effectiveDefense = effectiveDefense;
	}

	public Integer getEffectiveInitiative() {
		return effectiveInitiative;
	}

	public void setEffectiveInitiative(Integer effectiveInitiative) {
		this.effectiveInitiative = effectiveInitiative;
	}

	public Boolean getAttackable() {
		return attackable;
	}

	public void setAttackable(Boolean attackable) {
		this.attackable = attackable;
	}

	public CardViewDto getCard() {
		return card;
	}

	public void setCard(CardViewDto card) {
		this.card = card;
	}
}
