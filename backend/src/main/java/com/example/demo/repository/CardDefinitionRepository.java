package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.CardDefinition;

public interface CardDefinitionRepository extends JpaRepository<CardDefinition, Long> {

	List<CardDefinition> findAllByOrderByLevelAscIdAsc();

	Optional<CardDefinition> findByName(String name);
}
