package com.example.demo.dto;

public class HandCardDto {

	private String instanceId;
	private int handIndex;
	private boolean playable;
	private CardViewDto card;

	public String getInstanceId() {
		return instanceId;
	}

	public void setInstanceId(String instanceId) {
		this.instanceId = instanceId;
	}

	public int getHandIndex() {
		return handIndex;
	}

	public void setHandIndex(int handIndex) {
		this.handIndex = handIndex;
	}

	public boolean isPlayable() {
		return playable;
	}

	public void setPlayable(boolean playable) {
		this.playable = playable;
	}

	public CardViewDto getCard() {
		return card;
	}

	public void setCard(CardViewDto card) {
		this.card = card;
	}
}
