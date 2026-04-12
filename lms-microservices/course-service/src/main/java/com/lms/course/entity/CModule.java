package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Module / Élément Constitutif (EC)
 * Représente un module (EC) au sein d'une UE
 * Exemple: "Administration Systèmes" (DEV15011) dans l'UE DEV1501
 * 
 * Terminologie:
 * - UE (Unité d'Enseignement) = TeachingUnit
 * - Module/EC (Élément Constitutif) = CModule
 * - Séance = Course
 */
@Entity
@Table(name = "modules")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Code du module (ex: DEV15011)
    @Column(unique = true, nullable = false)
    private String codeEC;

    // Nom du module (ex: "Administration Systèmes")
    @Column(nullable = false)
    private String name;

    private String description;

    // Charge horaire détaillée
    @Column(nullable = false)
    private Integer cmHours;  // Cours Magistral (ex: 12)

    @Column(nullable = false)
    private Integer tdHours;  // Travaux Dirigés (ex: 8)

    @Column(nullable = false)
    private Integer tpHours;  // Travaux Pratiques (ex: 8)

    private Integer tpeHours;  // Travail Personnel Étudiant (ex: 12)

    // Total charge horaire (CM + TD + TP + TPE)
    @Column(nullable = false)
    private Integer totalCH;

    // Crédits de l'EC
    @Column(nullable = false)
    private Integer creditsEC;

    // Semestre (S5, S6)
    private String semester;

    // Niveau (DIC1, DIC2, DIC3)
    private String level;

    // Relation avec l'Unité d'Enseignement (obligatoire - un EC doit appartenir à une UE)
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "teaching_unit_id", nullable = false)
    private TeachingUnit teachingUnit;

    // Enseignant assigné (username)
    private String lecturerUsername;

    // Métadonnées temporelles
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "module", orphanRemoval = true)
    @JsonIgnore  // Éviter la circular reference JSON
    private Set<Course> courses = new HashSet<>();

    // Suivi de l'avancement
    private Integer completedHours = 0;
    
    // Validation manuelle de la fin du module (même si les heures ne sont pas toutes faites)
    private Boolean isValidated = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
        // Calcul automatique de la charge horaire totale
        if (this.totalCH == null) {
            this.totalCH = (cmHours != null ? cmHours : 0)
                         + (tdHours != null ? tdHours : 0)
                         + (tpHours != null ? tpHours : 0)
                         + (tpeHours != null ? tpeHours : 0);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        // Recalculer la charge horaire totale à chaque mise à jour
        this.totalCH = (cmHours != null ? cmHours : 0)
                     + (tdHours != null ? tdHours : 0)
                     + (tpHours != null ? tpHours : 0)
                     + (tpeHours != null ? tpeHours : 0);
    }

    public CModule() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodeEC() { return codeEC; }
    public void setCodeEC(String codeEC) { this.codeEC = codeEC; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getCmHours() { return cmHours; }
    public void setCmHours(Integer cmHours) { this.cmHours = cmHours; }

    public Integer getTdHours() { return tdHours; }
    public void setTdHours(Integer tdHours) { this.tdHours = tdHours; }

    public Integer getTpHours() { return tpHours; }
    public void setTpHours(Integer tpHours) { this.tpHours = tpHours; }

    public Integer getTpeHours() { return tpeHours; }
    public void setTpeHours(Integer tpeHours) { this.tpeHours = tpeHours; }

    public Integer getTotalCH() { return totalCH; }
    public void setTotalCH(Integer totalCH) { this.totalCH = totalCH; }

    public Integer getCreditsEC() { return creditsEC; }
    public void setCreditsEC(Integer creditsEC) { this.creditsEC = creditsEC; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public TeachingUnit getTeachingUnit() { return teachingUnit; }
    public void setTeachingUnit(TeachingUnit teachingUnit) { this.teachingUnit = teachingUnit; }

    public String getLecturerUsername() { return lecturerUsername; }
    public void setLecturerUsername(String lecturerUsername) { this.lecturerUsername = lecturerUsername; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public Set<Course> getCourses() { return courses; }
    public void setCourses(Set<Course> courses) { this.courses = courses; }

    public Integer getCompletedHours() { return completedHours != null ? completedHours : 0; }
    public void setCompletedHours(Integer completedHours) { this.completedHours = completedHours; }

    public Boolean getIsValidated() { return isValidated != null ? isValidated : false; }
    public void setIsValidated(Boolean isValidated) { this.isValidated = isValidated; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}
