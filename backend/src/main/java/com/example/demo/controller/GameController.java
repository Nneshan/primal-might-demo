package com.example.demo.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.AncientKnowledgeRequest;
import com.example.demo.dto.AttackRequest;
import com.example.demo.dto.GameStateResponseDto;
import com.example.demo.dto.PlayCardRequest;
import com.example.demo.dto.RewardCardsRequest;
import com.example.demo.service.GameService;

@RestController
@RequestMapping("/api/games")
@Validated
public class GameController {

	private final GameService gameService;

	public GameController(GameService gameService) {
		this.gameService = gameService;
	}

	@PostMapping
	public GameStateResponseDto createGame() {
		return gameService.createGame();
	}

	@GetMapping("/{gameId}")
	public GameStateResponseDto getGame(@PathVariable Long gameId) {
		return gameService.getGame(gameId);
	}

	@PostMapping("/{gameId}/play-card")
	public GameStateResponseDto playCard(@PathVariable Long gameId, @Validated @RequestBody PlayCardRequest request) {
		return gameService.playCard(gameId, request.getHandIndex());
	}

	@PostMapping("/{gameId}/ancient-knowledge")
	public GameStateResponseDto resolveAncientKnowledge(
		@PathVariable Long gameId,
		@Validated @RequestBody AncientKnowledgeRequest request
	) {
		return gameService.resolveAncientKnowledge(gameId, request.getPickedInstanceId());
	}

	@PostMapping("/{gameId}/end-play-phase")
	public GameStateResponseDto endPlayPhase(@PathVariable Long gameId) {
		return gameService.endPlayPhase(gameId);
	}

	@PostMapping("/{gameId}/attack")
	public GameStateResponseDto attack(@PathVariable Long gameId, @Validated @RequestBody AttackRequest request) {
		return gameService.attack(
			gameId,
			request.getAttackerInstanceId(),
			request.getTargetType(),
			request.getTargetInstanceId()
		);
	}

	@PostMapping("/{gameId}/skip-attack")
	public GameStateResponseDto skipAttack(@PathVariable Long gameId) {
		return gameService.skipAttack(gameId);
	}

	@PostMapping("/{gameId}/end-attack-phase")
	public GameStateResponseDto endAttackPhase(@PathVariable Long gameId) {
		return gameService.endAttackPhase(gameId);
	}

	@PostMapping("/{gameId}/rewards")
	public GameStateResponseDto addRewards(@PathVariable Long gameId, @Validated @RequestBody RewardCardsRequest request) {
		return gameService.addRewardCardsToPlayerDeck(gameId, request.getCardDefinitionIds());
	}
}
