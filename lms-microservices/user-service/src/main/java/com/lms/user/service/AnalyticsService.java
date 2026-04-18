package com.lms.user.service;

import com.lms.user.dto.AdaptiveProfileDto;
import com.lms.user.dto.RecommendationDto;
import com.lms.user.entity.AdaptiveProfile;
import com.lms.user.entity.Recommendation;
import com.lms.user.repository.AdaptiveProfileRepository;
import com.lms.user.repository.RecommendationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class AnalyticsService {

    private final AdaptiveProfileRepository adaptiveProfileRepository;
    private final RecommendationRepository recommendationRepository;

    public AdaptiveProfileDto getProfilAdaptatif(String username) {
        AdaptiveProfile profile = adaptiveProfileRepository.findByUsername(username).orElse(null);
        if (profile == null) {
            return null;
        }
        return convertToDto(profile);
    }

    public AdaptiveProfileDto createOrUpdateProfilAdaptatif(String username, Map<String, Object> data) {
        AdaptiveProfile profile = adaptiveProfileRepository.findByUsername(username)
                .orElse(new AdaptiveProfile());
        
        profile.setUsername(username);
        
        if (data.containsKey("niveauGlobal")) {
            profile.setNiveauGlobal((String) data.get("niveauGlobal"));
        }
        if (data.containsKey("classeMoyenne")) {
            profile.setClasseMoyenne(((Number) data.get("classeMoyenne")).doubleValue());
        }
        if (data.containsKey("competences")) {
            profile.setCompetences((Map<String, String>) data.get("competences"));
        }
        
        AdaptiveProfile saved = adaptiveProfileRepository.save(profile);
        return convertToDto(saved);
    }

    public List<RecommendationDto> getRecommandations(String username) {
        List<Recommendation> recommendations = recommendationRepository.findByUsernameOrderByCreatedDateDesc(username);
        return recommendations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public RecommendationDto createRecommandation(String username, Map<String, Object> data) {
        Recommendation recommendation = new Recommendation();
        recommendation.setUsername(username);
        recommendation.setTypeReco((String) data.get("typeReco"));
        recommendation.setCibleId((String) data.get("cibleId"));
        recommendation.setRaison((String) data.get("raison"));
        recommendation.setVue(false);
        
        Recommendation saved = recommendationRepository.save(recommendation);
        return convertToDto(saved);
    }

    public RecommendationDto markAsViewed(Long id) {
        Recommendation recommendation = recommendationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recommendation not found"));
        recommendation.setVue(true);
        Recommendation saved = recommendationRepository.save(recommendation);
        return convertToDto(saved);
    }

    private AdaptiveProfileDto convertToDto(AdaptiveProfile profile) {
        AdaptiveProfileDto dto = new AdaptiveProfileDto();
        dto.setId(profile.getId());
        dto.setUsername(profile.getUsername());
        dto.setNiveauGlobal(profile.getNiveauGlobal());
        dto.setClasseMoyenne(profile.getClasseMoyenne());
        dto.setCompetences(profile.getCompetences());
        dto.setDernierMisAJour(profile.getLastUpdated());
        return dto;
    }

    private RecommendationDto convertToDto(Recommendation recommendation) {
        RecommendationDto dto = new RecommendationDto();
        dto.setId(recommendation.getId());
        dto.setUsername(recommendation.getUsername());
        dto.setTypeReco(recommendation.getTypeReco());
        dto.setCibleId(recommendation.getCibleId());
        dto.setRaison(recommendation.getRaison());
        dto.setVue(recommendation.getVue());
        dto.setCreatedAt(recommendation.getCreatedDate());
        return dto;
    }
}
