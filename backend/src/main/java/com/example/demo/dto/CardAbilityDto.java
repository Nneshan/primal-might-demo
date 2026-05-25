package com.example.demo.dto;

import java.util.HashMap;
import java.util.Map;

public class CardAbilityDto {

	private String key;
	private String name;
	private String text;
	private Map<String, Integer> params = new HashMap<>();

	public CardAbilityDto() {
	}

	public CardAbilityDto(String key, String name, String text) {
		this.key = key;
		this.name = name;
		this.text = text;
	}

	public CardAbilityDto(String key, String name, String text, Map<String, Integer> params) {
		this.key = key;
		this.name = name;
		this.text = text;
		this.params = params != null ? params : new HashMap<>();
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public Map<String, Integer> getParams() {
		return params;
	}

	public void setParams(Map<String, Integer> params) {
		this.params = params;
	}

	public int param(String name, int defaultValue) {
		return params.getOrDefault(name, defaultValue);
	}
}
