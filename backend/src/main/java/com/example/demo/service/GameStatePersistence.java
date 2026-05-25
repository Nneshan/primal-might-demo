package com.example.demo.service;

import org.springframework.stereotype.Component;

import com.example.demo.game.GameState;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class GameStatePersistence {

	private final ObjectMapper objectMapper;

	public GameStatePersistence(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public String toJson(GameState state) {
		try {
			return objectMapper.writeValueAsString(state);
		}
		catch (JsonProcessingException e) {
			throw new IllegalStateException("Не удалось сохранить состояние игры", e);
		}
	}

	public GameState fromJson(String json) {
		try {
			return objectMapper.readValue(json, GameState.class);
		}
		catch (JsonProcessingException e) {
			throw new IllegalStateException("Не удалось прочитать состояние игры", e);
		}
	}
}
