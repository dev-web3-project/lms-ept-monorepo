package com.lms.announcement.repository;

import com.lms.announcement.entity.Announcement;
import com.lms.announcement.entity.TargetAudience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByType(String type);

    /** Annonces par audience exacte (ex: STUDENTS, LECTURERS, ALL) */
    List<Announcement> findAllByTargetAudience(TargetAudience targetAudience);

    /** Annonces ciblant une audience + un ID (COURSE ou CLASS) */
    List<Announcement> findAllByTargetAudienceAndTargetId(TargetAudience targetAudience, String targetId);

    /**
     * Récupère toutes les annonces visibles par un étudiant d'un cours donné et d'une classe donnée.
     * Inclut : ALL + STUDENTS + les annonces du cours + les annonces de la classe.
     */
    @Query("SELECT a FROM Announcement a WHERE " +
           "a.targetAudience = 'ALL' OR " +
           "a.targetAudience = 'STUDENTS' OR " +
           "(a.targetAudience = 'COURSE' AND a.targetId = :courseCode) OR " +
           "(a.targetAudience = 'CLASS' AND a.targetId = :classId)")
    List<Announcement> findAnnouncementsForStudent(@Param("courseCode") String courseCode,
                                                    @Param("classId") String classId);

    /**
     * Récupère toutes les annonces visibles par les enseignants.
     * Inclut : ALL + LECTURERS.
     */
    @Query("SELECT a FROM Announcement a WHERE " +
           "a.targetAudience = 'ALL' OR " +
           "a.targetAudience = 'LECTURERS'")
    List<Announcement> findAnnouncementsForLecturer();
}

