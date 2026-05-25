package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "card_definitions")
public class CardDefinition {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private int manaCost;

	@Column(nullable = false)
	private int health;

	@Column(nullable = false)
	private int attack;

	@Column(nullable = false)
	private int defense;

	@Column(nullable = false)
	private int initiative;

	@Column(nullable = false)
	private int level;

	/** Несколько типов через запятую, например: Дух,Древолюд */
	@Column(name = "creature_type", nullable = false, length = 120)
	private String creatureTypes;

	/** Путь для React: public/cards/... */
	@Column(nullable = false)
	private String spriteHand;

	@Column(nullable = false)
	private String spriteBoard;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public int getManaCost() {
		return manaCost;
	}

	public void setManaCost(int manaCost) {
		this.manaCost = manaCost;
	}

	public int getHealth() {
		return health;
	}

	public void setHealth(int health) {
		this.health = health;
	}

	public int getAttack() {
		return attack;
	}

	public void setAttack(int attack) {
		this.attack = attack;
	}

	public int getDefense() {
		return defense;
	}

	public void setDefense(int defense) {
		this.defense = defense;
	}

	public int getInitiative() {
		return initiative;
	}

	public void setInitiative(int initiative) {
		this.initiative = initiative;
	}

	public int getLevel() {
		return level;
	}

	public void setLevel(int level) {
		this.level = level;
	}

	public String getCreatureTypes() {
		return creatureTypes;
	}

	public void setCreatureTypes(String creatureTypes) {
		this.creatureTypes = creatureTypes;
	}

	public String getSpriteHand() {
		return spriteHand;
	}

	public void setSpriteHand(String spriteHand) {
		this.spriteHand = spriteHand;
	}

	public String getSpriteBoard() {
		return spriteBoard;
	}

	public void setSpriteBoard(String spriteBoard) {
		this.spriteBoard = spriteBoard;
	}
}
