package com.example.demo.dto;

import java.util.ArrayList;
import java.util.List;

public class CardViewDto {

	private Long id;
	private String name;
	private int manaCost;
	private int health;
	private int attack;
	private int defense;
	private int initiative;
	private int level;
	private List<String> creatureTypes;
	private String spriteHand;
	private String spriteBoard;
	private List<CardAbilityDto> abilities = new ArrayList<>();
	private String flavorText;

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

	public List<String> getCreatureTypes() {
		return creatureTypes;
	}

	public void setCreatureTypes(List<String> creatureTypes) {
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

	public List<CardAbilityDto> getAbilities() {
		return abilities;
	}

	public void setAbilities(List<CardAbilityDto> abilities) {
		this.abilities = abilities;
	}

	public String getFlavorText() {
		return flavorText;
	}

	public void setFlavorText(String flavorText) {
		this.flavorText = flavorText;
	}
}
