package com.example.demo.game;

public class CardInZone {

	private String instanceId;
	private Long cardDefinitionId;

	public CardInZone() {
	}

	public CardInZone(String instanceId, Long cardDefinitionId) {
		this.instanceId = instanceId;
		this.cardDefinitionId = cardDefinitionId;
	}

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
}
