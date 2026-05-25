package com.example.demo.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(GameRuleException.class)
	public ResponseEntity<Map<String, String>> handleGameRule(GameRuleException ex) {
		return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
	}
}
