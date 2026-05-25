package com.example.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.CardViewDto;
import com.example.demo.service.CardCatalogService;

@RestController
@RequestMapping("/api/cards")
public class CardController {

	private final CardCatalogService cardCatalogService;

	public CardController(CardCatalogService cardCatalogService) {
		this.cardCatalogService = cardCatalogService;
	}

	@GetMapping
	public List<CardViewDto> getAllCards() {
		return cardCatalogService.getAllCards();
	}
}
