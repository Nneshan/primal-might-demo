package com.example.demo.dto;

import jakarta.validation.constraints.Min;

public class PlayCardRequest {

	@Min(0)
	private int handIndex;

	public int getHandIndex() {
		return handIndex;
	}

	public void setHandIndex(int handIndex) {
		this.handIndex = handIndex;
	}
}
