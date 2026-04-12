package com.lms.course.repository;

import com.lms.course.entity.CModule;
import com.lms.course.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByModule(CModule module);
    List<Quiz> findByModuleId(Long moduleId);
    boolean existsByTitleAndModuleId(String title, Long moduleId);
}
