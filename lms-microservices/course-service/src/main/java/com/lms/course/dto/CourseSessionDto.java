package com.lms.course.dto;

import java.time.LocalDateTime;

/**
 * DTO pour créer/mettre à jour une Course Session (Séance)
 */
public class CourseSessionDto {
    
    private LocalDateTime sessionDate;
    private Integer ordre;
    private Integer duree;
    private String typeSeance; // COURS_MAGISTRAL, TD, TP, TPE
    private String objectifs;
    private String contenu;

    public CourseSessionDto() {}

    // Getters and Setters
    public LocalDateTime getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDateTime sessionDate) { this.sessionDate = sessionDate; }

    public Integer getOrdre() { return ordre; }
    public void setOrdre(Integer ordre) { this.ordre = ordre; }

    public Integer getDuree() { return duree; }
    public void setDuree(Integer duree) { this.duree = duree; }

    public String getTypeSeance() { return typeSeance; }
    public void setTypeSeance(String typeSeance) { this.typeSeance = typeSeance; }

    public String getObjectifs() { return objectifs; }
    public void setObjectifs(String objectifs) { this.objectifs = objectifs; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }
}
