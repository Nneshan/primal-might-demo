package com.example.demo.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.example.demo.game.CardInZone;

@Component
public class DeckFactory {

	public List<CardInZone> buildDeck(List<Long> cardDefinitionIds) {
		List<CardInZone> deck = new ArrayList<>();
		for (Long cardDefinitionId : cardDefinitionIds) {
			deck.add(new CardInZone(UUID.randomUUID().toString(), cardDefinitionId));
		}
		Collections.shuffle(deck);
		return deck;
	}

	public void drawCards(List<CardInZone> deck, List<CardInZone> hand, int count) {
		for (int i = 0; i < count && !deck.isEmpty(); i++) {
			hand.add(deck.remove(0));
		}
	}

	public void addCardsToDeck(List<CardInZone> deck, List<Long> cardDefinitionIds) {
		for (Long cardDefinitionId : cardDefinitionIds) {
			deck.add(new CardInZone(UUID.randomUUID().toString(), cardDefinitionId));
		}
		Collections.shuffle(deck);
	}
}
