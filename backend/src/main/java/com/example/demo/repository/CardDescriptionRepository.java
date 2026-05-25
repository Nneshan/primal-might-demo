package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.CardDescription;

public interface CardDescriptionRepository extends JpaRepository<CardDescription, Long> {

	Optional<CardDescription> findByCardDefinitionId(Long cardDefinitionId);
}
