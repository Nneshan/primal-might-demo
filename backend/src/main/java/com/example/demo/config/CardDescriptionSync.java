package com.example.demo.config;

import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.demo.dto.CardAbilityDto;
import com.example.demo.entity.CardDefinition;
import com.example.demo.entity.CardDescription;
import com.example.demo.game.AbilityKey;
import com.example.demo.repository.CardDefinitionRepository;
import com.example.demo.repository.CardDescriptionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
@Order(3)
public class CardDescriptionSync implements ApplicationRunner {

	private final CardDefinitionRepository cardDefinitionRepository;
	private final CardDescriptionRepository cardDescriptionRepository;
	private final ObjectMapper objectMapper;

	public CardDescriptionSync(
		CardDefinitionRepository cardDefinitionRepository,
		CardDescriptionRepository cardDescriptionRepository,
		ObjectMapper objectMapper
	) {
		this.cardDefinitionRepository = cardDefinitionRepository;
		this.cardDescriptionRepository = cardDescriptionRepository;
		this.objectMapper = objectMapper;
	}

	@Override
	public void run(ApplicationArguments args) throws JsonProcessingException {
		desc("Флороид", List.of(
			ability(
				AbilityKey.FOREST_UNITY_DEF,
				"Единство Леса",
				"Если на поле есть другой дружественный древолюд с силой больше 3, Флороид получает +1 к броне.",
				Map.of("minAllyAttack", 3, "bonusDefense", 1)
			)
		), "Маленький страж большого леса.");

		desc("Мрачнодрев", List.of(
			ability(
				AbilityKey.INTIMIDATION,
				"Устрашение",
				"Если у защищающегося существа атака меньше, чем у атакующего, то при атаке атакующий не получает ответного урона. Не работает на существо со свойством *Твердость Скалы*."
			),
			ability(
				AbilityKey.PIERCING,
				"Пробитие",
				"Атаки игнорируют броню противника. Не работает на существ со свойством *Твердость Скалы*."
			)
		), "Лес помнит всех. Он не забывает. Он не прощает.");

		desc("Элдорн", List.of(
			ability(
				AbilityKey.FOREST_UNITY_ATK_DEF,
				"Единство Леса",
				"Если на поле есть другой дружественный древолюд с силой больше 5, Элдорн получает +2 к атаке и +2 к броне.",
				Map.of("minAllyAttack", 5, "bonusAttack", 2, "bonusDefense", 2)
			),
			ability(
				AbilityKey.ANCIENT_KNOWLEDGE,
				"Древние Знания",
				"При выходе Элдорна на поле посмотрите 3 верхние карты вашей колоды. Возьмите 1 в руку, остальные положите в случайном порядке вниз колоды."
			)
		), "Ты видишь дерево. Я вижу тысячу лет войн, пережитых в тишине.");

		desc("Гонец облаков", List.of(
			ability(
				AbilityKey.FLIGHT,
				"Полёт",
				"Может быть заблокирован только существами с *Полёт* или *Перехват*. "
					+ "Не может блокировать существ без *Полёта*."
			),
			ability(AbilityKey.TAILWIND, "Попутный Ветер", "Другие дружественные существа с *Полёт* получают +1 к инициативе.")
		), "Скорость её свобода. Небо - её дом. Ветер - её путь.");

		desc("Корнестраж", List.of(
			ability(
				AbilityKey.FOREST_UNITY_ATK,
				"Единство Леса",
				"Если на поле есть другой дружественный древолюд с силой больше 4, Корнестраж получает +2 к атаке.",
				Map.of("minAllyAttack", 4, "bonusAttack", 2)
			),
			ability(
				AbilityKey.TAUNT,
				"Защитник",
				"Вражеские существа должны атаковать Корнестража, если могут."
			)
		), "\"Нападай, если осмелишься. Ты не первый и не последний.\"");

		desc("Дриада", List.of(
			ability(
				AbilityKey.RANGED,
				"Дальняя Атака",
				"При атаке не получает ответного урона от защищающегося существа."
			),
			ability(
				AbilityKey.FOREST_UNITY_DEF,
				"Единство Леса",
				"Если на поле есть другой дружественный древолюд с силой больше 3, Дриада получает +2 к броне.",
				Map.of("minAllyAttack", 3, "bonusDefense", 2)
			)
		), "Кто уважает лес, тот получает его защиту. Кто нарушает — встречает её копыта.");
	}

	private CardAbilityDto ability(AbilityKey key, String name, String text) {
		return new CardAbilityDto(key.name(), name, text);
	}

	private CardAbilityDto ability(AbilityKey key, String name, String text, Map<String, Integer> params) {
		return new CardAbilityDto(key.name(), name, text, params);
	}

	private void desc(String cardName, List<CardAbilityDto> abilities, String flavorText)
		throws JsonProcessingException {
		CardDefinition card = cardDefinitionRepository.findByName(cardName).orElse(null);
		if (card == null) {
			return;
		}
		CardDescription description = cardDescriptionRepository.findByCardDefinitionId(card.getId())
			.orElseGet(CardDescription::new);
		description.setCardDefinition(card);
		description.setAbilitiesJson(objectMapper.writeValueAsString(abilities));
		description.setFlavorText(flavorText);
		cardDescriptionRepository.save(description);
	}
}
