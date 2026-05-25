package com.example.demo.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.demo.entity.CardDefinition;
import com.example.demo.repository.CardDefinitionRepository;

@Component
public class CardDataSeeder implements ApplicationRunner {

	private final CardDefinitionRepository cardDefinitionRepository;

	public CardDataSeeder(CardDefinitionRepository cardDefinitionRepository) {
		this.cardDefinitionRepository = cardDefinitionRepository;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (cardDefinitionRepository.count() > 0) {
			return;
		}

		cardDefinitionRepository.saveAll(java.util.List.of(
			card("Флороид", 2, 5, 2, 0, 3, 1, "Дух,Древолюд", "FloroidHand.png", "Floroid.png"),
			card("Мрачнодрев", 5, 20, 4, 2, 3, 4, "Дух,Древолюд", "DarkwoodHand.png", "Darkwood.png"),
			card("Элдорн", 6, 25, 6, 2, 3, 5, "Дух,Древолюд", "EldornHand.png", "Eldorn.png"),
			card("Корнестраж", 5, 25, 3, 3, 2, 4, "Дух,Древолюд", "RootwardenHand.png", "Rootwarden.png"),
			card("Гонец облаков", 3, 8, 4, 0, 9, 2, "Дух", "RunnerOfCloudsHand.png", "RunnerOfClouds.png"),
			card("Дриада", 3, 9, 3, 0, 8, 3, "Дух,Древолюд", "DryadHand.png", "Dryad.png")
		));
	}

	private CardDefinition card(
		String name,
		int mana,
		int health,
		int attack,
		int defense,
		int initiative,
		int level,
		String types,
		String spriteHand,
		String spriteBoard
	) {
		CardDefinition definition = new CardDefinition();
		definition.setName(name);
		definition.setManaCost(mana);
		definition.setHealth(health);
		definition.setAttack(attack);
		definition.setDefense(defense);
		definition.setInitiative(initiative);
		definition.setLevel(level);
		definition.setCreatureTypes(types);
		definition.setSpriteHand("/cards/" + spriteHand);
		definition.setSpriteBoard("/cards/" + spriteBoard);
		return definition;
	}
}
