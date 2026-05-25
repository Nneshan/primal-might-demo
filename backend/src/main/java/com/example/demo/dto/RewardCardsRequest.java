package com.example.demo.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public class RewardCardsRequest {

	@NotEmpty
	private List<Long> cardDefinitionIds;

	public List<Long> getCardDefinitionIds() {
		return cardDefinitionIds;
	}

	public void setCardDefinitionIds(List<Long> cardDefinitionIds) {
		this.cardDefinitionIds = cardDefinitionIds;
	}
}
