package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "card_descriptions")
public class CardDescription {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "card_definition_id", unique = true, nullable = false)
	private CardDefinition cardDefinition;

	/** JSON: [{"name":"...","text":"... с *курсивом* внутри"}] */
	@Column(columnDefinition = "TEXT")
	private String abilitiesJson;

	@Column(columnDefinition = "TEXT")
	private String flavorText;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public CardDefinition getCardDefinition() {
		return cardDefinition;
	}

	public void setCardDefinition(CardDefinition cardDefinition) {
		this.cardDefinition = cardDefinition;
	}

	public String getAbilitiesJson() {
		return abilitiesJson;
	}

	public void setAbilitiesJson(String abilitiesJson) {
		this.abilitiesJson = abilitiesJson;
	}

	public String getFlavorText() {
		return flavorText;
	}

	public void setFlavorText(String flavorText) {
		this.flavorText = flavorText;
	}
}
