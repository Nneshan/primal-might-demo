package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;

public class AncientKnowledgeRequest {

	@NotBlank
	private String pickedInstanceId;

	public String getPickedInstanceId() {
		return pickedInstanceId;
	}

	public void setPickedInstanceId(String pickedInstanceId) {
		this.pickedInstanceId = pickedInstanceId;
	}
}
