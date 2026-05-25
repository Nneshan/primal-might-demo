package com.example.demo.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.demo.entity.CardDefinition;
import com.example.demo.repository.CardDefinitionRepository;

@Component
@Order(2)
public class CardCatalogSync implements ApplicationRunner {

	private final CardDefinitionRepository cardDefinitionRepository;

	public CardCatalogSync(CardDefinitionRepository cardDefinitionRepository) {
		this.cardDefinitionRepository = cardDefinitionRepository;
	}

	@Override
	public void run(ApplicationArguments args) {
		upsert("Флороид", 2, 5, 2, 0, 3, 1, "Дух,Древолюд", "FloroidHand.png", "Floroid.png");
		upsert("Мрачнодрев", 5, 20, 4, 2, 3, 4, "Дух,Древолюд", "DarkwoodHand.png", "Darkwood.png");
		upsert("Элдорн", 6, 25, 6, 2, 3, 5, "Дух,Древолюд", "EldornHand.png", "Eldorn.png");
		upsert("Корнестраж", 5, 25, 3, 3, 2, 4, "Дух,Древолюд", "RootwardenHand.png", "Rootwarden.png");
		upsert("Гонец облаков", 3, 8, 4, 0, 9, 2, "Дух", "RunnerOfCloudsHand.png", "RunnerOfClouds.png");
		upsert("Дриада", 3, 9, 3, 0, 8, 3, "Дух,Древолюд", "DryadHand.png", "Dryad.png");
		renameAndUpsert("Лесной дух", "Флороид", 2, 5, 2, 0, 3, 1, "Дух,Древолюд", "FloroidHand.png", "Floroid.png");
	}

	private void renameAndUpsert(
		String oldName,
		String newName,
		int mana,
		int health,
		int attack,
		int defense,
		int initiative,
		int level,
		String types,
		String hand,
		String board
	) {
		cardDefinitionRepository.findByName(oldName).ifPresent(card -> {
			card.setName(newName);
			apply(card, mana, health, attack, defense, initiative, level, types, hand, board);
			cardDefinitionRepository.save(card);
		});
		upsert(newName, mana, health, attack, defense, initiative, level, types, hand, board);
	}

	private void upsert(
		String name,
		int mana,
		int health,
		int attack,
		int defense,
		int initiative,
		int level,
		String types,
		String hand,
		String board
	) {
		CardDefinition card = cardDefinitionRepository.findByName(name).orElseGet(CardDefinition::new);
		card.setName(name);
		apply(card, mana, health, attack, defense, initiative, level, types, hand, board);
		cardDefinitionRepository.save(card);
	}

	private void apply(
		CardDefinition card,
		int mana,
		int health,
		int attack,
		int defense,
		int initiative,
		int level,
		String types,
		String hand,
		String board
	) {
		card.setManaCost(mana);
		card.setHealth(health);
		card.setAttack(attack);
		card.setDefense(defense);
		card.setInitiative(initiative);
		card.setLevel(level);
		card.setCreatureTypes(types);
		card.setSpriteHand("/cards/" + hand);
		card.setSpriteBoard("/cards/" + board);
	}
}
