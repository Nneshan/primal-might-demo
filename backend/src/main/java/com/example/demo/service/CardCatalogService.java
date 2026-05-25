package com.example.demo.service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.CardAbilityDto;
import com.example.demo.dto.CardViewDto;
import com.example.demo.entity.CardDefinition;
import com.example.demo.repository.CardDefinitionRepository;
import com.example.demo.repository.CardDescriptionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class CardCatalogService {

	private final CardDefinitionRepository cardDefinitionRepository;
	private final CardDescriptionRepository cardDescriptionRepository;
	private final ObjectMapper objectMapper;

	public CardCatalogService(
		CardDefinitionRepository cardDefinitionRepository,
		CardDescriptionRepository cardDescriptionRepository,
		ObjectMapper objectMapper
	) {
		this.cardDefinitionRepository = cardDefinitionRepository;
		this.cardDescriptionRepository = cardDescriptionRepository;
		this.objectMapper = objectMapper;
	}

	public List<CardViewDto> getAllCards() {
		return cardDefinitionRepository.findAllByOrderByLevelAscIdAsc().stream()
			.map(this::toDto)
			.toList();
	}

	public CardViewDto toDto(CardDefinition definition) {
		if (definition == null) {
			return null;
		}
		CardViewDto dto = new CardViewDto();
		dto.setId(definition.getId());
		dto.setName(definition.getName());
		dto.setManaCost(definition.getManaCost());
		dto.setHealth(definition.getHealth());
		dto.setAttack(definition.getAttack());
		dto.setDefense(definition.getDefense());
		dto.setInitiative(definition.getInitiative());
		dto.setLevel(definition.getLevel());
		dto.setCreatureTypes(parseTypes(definition.getCreatureTypes()));
		dto.setSpriteHand(definition.getSpriteHand());
		dto.setSpriteBoard(definition.getSpriteBoard());
		cardDescriptionRepository.findByCardDefinitionId(definition.getId()).ifPresent(description -> {
			dto.setAbilities(parseAbilities(description.getAbilitiesJson()));
			dto.setFlavorText(description.getFlavorText());
		});
		return dto;
	}

	public List<CardAbilityDto> getAbilitiesForCard(Long cardDefinitionId) {
		return cardDescriptionRepository.findByCardDefinitionId(cardDefinitionId)
			.map(description -> parseAbilities(description.getAbilitiesJson()))
			.orElse(Collections.emptyList());
	}

	private List<CardAbilityDto> parseAbilities(String json) {
		if (json == null || json.isBlank()) {
			return Collections.emptyList();
		}
		try {
			return objectMapper.readValue(json, new TypeReference<List<CardAbilityDto>>() {
			});
		}
		catch (Exception exception) {
			return Collections.emptyList();
		}
	}

	private List<String> parseTypes(String raw) {
		if (raw == null || raw.isBlank()) {
			return List.of();
		}
		return Arrays.stream(raw.split(","))
			.map(String::trim)
			.filter(type -> !type.isEmpty())
			.toList();
	}
}
