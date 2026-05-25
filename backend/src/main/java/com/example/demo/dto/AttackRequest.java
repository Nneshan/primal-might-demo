package com.example.demo.dto;

import com.example.demo.game.AttackTargetType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AttackRequest {

	@NotBlank
	private String attackerInstanceId;

	@NotNull
	private AttackTargetType targetType;

	private String targetInstanceId;

	public String getAttackerInstanceId() {
		return attackerInstanceId;
	}

	public void setAttackerInstanceId(String attackerInstanceId) {
		this.attackerInstanceId = attackerInstanceId;
	}

	public AttackTargetType getTargetType() {
		return targetType;
	}

	public void setTargetType(AttackTargetType targetType) {
		this.targetType = targetType;
	}

	public String getTargetInstanceId() {
		return targetInstanceId;
	}

	public void setTargetInstanceId(String targetInstanceId) {
		this.targetInstanceId = targetInstanceId;
	}
}
