package com.example.demo.game;

public enum Faction {

	MIGHT("Могущество", "Might");

	private final String labelRu;
	private final String labelEn;

	Faction(String labelRu, String labelEn) {
		this.labelRu = labelRu;
		this.labelEn = labelEn;
	}

	public String getLabelRu() {
		return labelRu;
	}

	public String getLabelEn() {
		return labelEn;
	}
}
