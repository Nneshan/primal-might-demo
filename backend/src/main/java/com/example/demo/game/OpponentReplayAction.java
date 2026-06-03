package com.example.demo.game;

import com.example.demo.dto.CardViewDto;

public class OpponentReplayAction {

	private OpponentReplayActionType type;
	private String instanceId;
	private String attackerInstanceId;
	private String targetInstanceId;
	private CardViewDto card;
	private Integer attackerHealthAfter;
	private Integer targetHealthAfter;
	private boolean attackerRemoved;
	private boolean targetRemoved;
	private Integer playerHealthAfter;

	public OpponentReplayActionType getType() {
		return type;
	}

	public void setType(OpponentReplayActionType type) {
		this.type = type;
	}

	public String getInstanceId() {
		return instanceId;
	}

	public void setInstanceId(String instanceId) {
		this.instanceId = instanceId;
	}

	public String getAttackerInstanceId() {
		return attackerInstanceId;
	}

	public void setAttackerInstanceId(String attackerInstanceId) {
		this.attackerInstanceId = attackerInstanceId;
	}

	public String getTargetInstanceId() {
		return targetInstanceId;
	}

	public void setTargetInstanceId(String targetInstanceId) {
		this.targetInstanceId = targetInstanceId;
	}

	public CardViewDto getCard() {
		return card;
	}

	public void setCard(CardViewDto card) {
		this.card = card;
	}

	public Integer getAttackerHealthAfter() {
		return attackerHealthAfter;
	}

	public void setAttackerHealthAfter(Integer attackerHealthAfter) {
		this.attackerHealthAfter = attackerHealthAfter;
	}

	public Integer getTargetHealthAfter() {
		return targetHealthAfter;
	}

	public void setTargetHealthAfter(Integer targetHealthAfter) {
		this.targetHealthAfter = targetHealthAfter;
	}

	public boolean isAttackerRemoved() {
		return attackerRemoved;
	}

	public void setAttackerRemoved(boolean attackerRemoved) {
		this.attackerRemoved = attackerRemoved;
	}

	public boolean isTargetRemoved() {
		return targetRemoved;
	}

	public void setTargetRemoved(boolean targetRemoved) {
		this.targetRemoved = targetRemoved;
	}

	public Integer getPlayerHealthAfter() {
		return playerHealthAfter;
	}

	public void setPlayerHealthAfter(Integer playerHealthAfter) {
		this.playerHealthAfter = playerHealthAfter;
	}
}
